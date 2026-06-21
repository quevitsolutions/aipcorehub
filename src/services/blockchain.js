import { ethers } from "ethers";
import { CONTRACTS, RPC_NODES } from "../config/constants.js";
import {
  AIPCORE_ABI,
  AIPVIEW_ABI,
  REWARDPOOL_ABI,
} from "../../contracts/abi.js";
import { api } from "./api.js"; // zero-RPC post-tx DB confirm

const MULTICALL_ABI = [
  "function aggregate(tuple(address target, bytes callData)[] calls) view returns (uint256 blockNumber, bytes[] returnData)",
  "function tryAggregate(bool requireSuccess, tuple(address target, bytes callData)[] calls) view returns (tuple(bool success, bytes returnData)[] returnData)"
];
const MULTICALL_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";
import { config } from "../config/wagmi.js";
import { getEthersProvider, getEthersSigner } from "../utils/ethers-adapter.js";

/**
 * AIPCore Blockchain Service (Ethers v6) - 4-source Tier Waterfall
 *   Sources (priority order):
 *   1. AIPVIEW  getNodeStats(nId)[3]  → 'level'  (independent view contract)
 *   2. AIPCORE  getNodeStats(nId)[0]  → 'tier'   (core stats)
 *   3. AIPCORE  nodes(nId)[5]        → struct tier field (raw)
 *   4. REWARDPOOL getPoolViewHelper(nId)[8] → nfeTier
 */
class BlockchainService {
  constructor() {
    const bscChainId = 56;
    const providers = RPC_NODES.map(url => new ethers.JsonRpcProvider(url, bscChainId, { staticNetwork: true }));
    this.staticProvider = new ethers.FallbackProvider(providers);
    this.core = new ethers.Contract(
      CONTRACTS.AIPCORE,
      AIPCORE_ABI,
      this.staticProvider,
    );
    this.view = new ethers.Contract(
      CONTRACTS.AIPVIEW,
      AIPVIEW_ABI,
      this.staticProvider,
    );
    this.pool = new ethers.Contract(
      CONTRACTS.REWARDPOOL,
      REWARDPOOL_ABI,
      this.staticProvider,
    );
    this.multicall = new ethers.Contract(
      MULTICALL_ADDRESS,
      MULTICALL_ABI,
      this.staticProvider
    );
  }

  _getProvider() {
    return getEthersProvider(config) || this.staticProvider;
  }

  async getOwner() {
    return this.core.owner();
  }

  // ── Full dashboard hydration ──────────────────────────────────────────────
  async getFullDashboardData(address) {
    try {
      const nId = await this.core.nodeId(address);
      if (!nId || Number(nId) === 0) return { nodeId: 0, hasNode: false };

      // Batch all 9 calls into a single Multicall tryAggregate transaction
      const calls = [
        { target: CONTRACTS.AIPVIEW, callData: this.view.interface.encodeFunctionData("getNodeStats", [nId]) },
        { target: CONTRACTS.AIPCORE, callData: this.core.interface.encodeFunctionData("getNodeStats", [nId]) },
        { target: CONTRACTS.AIPCORE, callData: this.core.interface.encodeFunctionData("nodes", [nId]) },
        { target: CONTRACTS.AIPCORE, callData: this.core.interface.encodeFunctionData("isNodeActive", [nId]) },
        { target: CONTRACTS.AIPCORE, callData: this.core.interface.encodeFunctionData("pendingReward", [address]) },
        { target: CONTRACTS.REWARDPOOL, callData: this.pool.interface.encodeFunctionData("getPoolViewHelper", [nId]) },
        { target: CONTRACTS.AIPVIEW, callData: this.view.interface.encodeFunctionData("getIncomeBreakdown", [nId]) },
        { target: CONTRACTS.REWARDPOOL, callData: this.pool.interface.encodeFunctionData("getClaimable", [nId]) },
        { target: CONTRACTS.REWARDPOOL, callData: this.pool.interface.encodeFunctionData("getCapInfo", [nId]) }
      ];

      const results = await this.multicall.tryAggregate(false, calls);

      const viewStats = results[0].success ? this.view.interface.decodeFunctionResult("getNodeStats", results[0].returnData) : null;
      const coreStats = results[1].success ? this.core.interface.decodeFunctionResult("getNodeStats", results[1].returnData) : null;
      const nodeRaw = results[2].success ? this.core.interface.decodeFunctionResult("nodes", results[2].returnData) : null;
      const isActive = results[3].success ? this.core.interface.decodeFunctionResult("isNodeActive", results[3].returnData)[0] : false;
      const pending = results[4].success ? this.core.interface.decodeFunctionResult("pendingReward", results[4].returnData)[0] : 0n;
      const poolData = results[5].success ? this.pool.interface.decodeFunctionResult("getPoolViewHelper", results[5].returnData) : null;
      const viewBreakdown = results[6].success ? this.view.interface.decodeFunctionResult("getIncomeBreakdown", results[6].returnData) : null;
      const poolClaimableData = results[7].success ? this.pool.interface.decodeFunctionResult("getClaimable", results[7].returnData) : null;
      const capInfo = results[8].success ? this.pool.interface.decodeFunctionResult("getCapInfo", results[8].returnData) : null;

      // ── 4-source tier waterfall ──
      const t1 = viewStats ? Number(viewStats[3]) : 0; // AIPVIEW  level   (index 3)
      const t2 = coreStats ? Number(coreStats[0]) : 0; // AIPCORE  tier    (index 0)
      const t3 = nodeRaw ? Number(nodeRaw[5]) : 0; // nodes()  tier    (index 5)
      const t4 = poolData ? Number(poolData[8]) : 0; // pool     nfeTier (index 8)

      const tier = t1 > 0 ? t1 : t2 > 0 ? t2 : t3 > 0 ? t3 : t4 > 0 ? t4 : 1; // final fallback (node exists but tier unreachable)

      console.debug(
        `[Tier] nId=${Number(nId)} AIPVIEW=${t1} CoreStats=${t2} nodes[5]=${t3} pool.nfeTier=${t4} → FINAL=${tier}`,
      );

      // ── directRefs / teamSize: prefer coreStats, fallback viewStats ──
      const directRefs = coreStats
        ? Number(coreStats[1])
        : viewStats
          ? Number(viewStats[2])
          : 0;
      const teamSize = coreStats
        ? Number(coreStats[2])
        : viewStats
          ? Number(viewStats[1])
          : 0;
      const totalEarned = coreStats
        ? ethers.formatEther(coreStats[3] || 0n)
        : "0";

      // ── pendingReward: prefer AIPVIEW breakdown[3] → fallback AIPCORE pendingReward ──
      // AIPVIEW gives per-node pending; AIPCORE pendingReward(address) can be 0 if already claimed on-chain
      const pendingFromView = viewBreakdown ? viewBreakdown[3] : null;
      const finalPending = (pendingFromView && BigInt(pendingFromView) > 0n)
        ? BigInt(pendingFromView)
        : (pending || 0n);

      // ── poolClaimable: prefer getClaimable()[2] (total) → fallback getPoolViewHelper[2] ──
      // getClaimable() is the dedicated function; getPoolViewHelper[2] may lag for unclaimed exits
      const poolClaimTotal = poolClaimableData ? poolClaimableData[2] : null;
      const finalPoolClaimable = (poolClaimTotal && BigInt(poolClaimTotal) > 0n)
        ? BigInt(poolClaimTotal)
        : (poolData?.[2] || 0n);

      // ── totalPoolEarned: AIPVIEW getIncomeBreakdown()[2] = pool income (most accurate) ──
      // Falls back to getPoolViewHelper[3] if AIPVIEW unavailable
      const poolEarned = viewBreakdown && BigInt(viewBreakdown[2] || 0n) > 0n
        ? viewBreakdown[2]
        : (poolData?.[3] || 0n);

      // ── totalPoolClaimed: getCapInfo()[3] = claimed against cap (dedicated tracker) ──
      // Falls back to getPoolViewHelper[4] if getCapInfo unavailable
      const poolClaimed = capInfo && BigInt(capInfo[3] || 0n) > 0n
        ? capInfo[3]
        : (poolData?.[4] || 0n);

      return {
        hasNode: true,
        nodeId: Number(nId),
        tier,
        directRefs,
        teamSize,
        totalEarned,
        nodeActive: isActive,
        pendingReward:    ethers.formatEther(finalPending),
        poolClaimable:    ethers.formatEther(finalPoolClaimable),
        poolName:         String(poolData?.[1] || "None"),
        totalDeposited:   ethers.formatEther(capInfo?.[1] || poolData?.[7] || 0n),
        isPoolQualified:  Boolean(poolData?.[9]),
        totalPoolEarned:  ethers.formatEther(poolEarned),
        totalPoolClaimed: ethers.formatEther(poolClaimed),
        remainingCap:     ethers.formatEther(capInfo?.[4] || poolData?.[5] || 0n),
        lifetimeCap:      ethers.formatEther(capInfo?.[2] || poolData?.[6] || 0n),
        missingDirects:   Number(poolData?.[11]?.[0] || 0),
        missingTier:      Number(poolData?.[11]?.[1] || 0),
        missingTeam:      Number(poolData?.[11]?.[2] || 0),
      };
    } catch (err) {
      console.error("getFullDashboardData failed:", err);
      throw err;
    }
  }

  async getBnbBalance(address) {
    const p = this._getProvider();
    const bal = await p.getBalance(address);
    return ethers.formatEther(bal);
  }

  async _getBnbUsdPrice() {
    // Simple in-memory cache (5 min TTL)
    const now = Date.now();
    if (this._bnbPrice && now - this._bnbPriceFetchedAt < 5 * 60 * 1000) {
      return this._bnbPrice;
    }

    // Primary: On-chain oracle from AIPCore contract (8 decimal uint, e.g. 60000000000 = $600)
    try {
      const raw = await this.core.bnbPrice();
      const price = Number(raw) / 1e8;
      if (price > 0) {
        this._bnbPrice = price;
        this._bnbPriceFetchedAt = now;
        return this._bnbPrice;
      }
    } catch { /* fall through */ }

    // Fallback 1: Binance REST API
    try {
      const res = await fetch(
        "https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT",
      );
      const json = await res.json();
      this._bnbPrice = parseFloat(json.price);
      this._bnbPriceFetchedAt = now;
      return this._bnbPrice;
    } catch { /* fall through */ }

    // Fallback 2: CoinGecko
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd",
      );
      const json = await res.json();
      this._bnbPrice = json?.binancecoin?.usd || 600;
      this._bnbPriceFetchedAt = now;
      return this._bnbPrice;
    } catch { /* fall through */ }

    // Last resort: use stale value or hardcoded default
    this._bnbPrice = this._bnbPrice || 600;
    return this._bnbPrice;
  }

  async fetchTeamHistoryOnChain(nodeId, length = 50) {
    try {
      if (!nodeId || Number(nodeId) === 0) return [];

      const [historyItems, bnbPrice] = await Promise.all([
        this.core.getIncome(nodeId, length),
        this._getBnbUsdPrice(),
      ]);

      // FIX: Filter nullish entries; use index access as primary (more reliable than named in ethers v6)
      return historyItems
        .filter(item => item != null)
        .map((item) => {
          const rType  = Number(item[5] ?? item.rewardType ?? 0);
          const tierVal = Number(item[6] ?? item.tier ?? 0);
          let eventName = "Team Reward";

          if (rType === 1)
            eventName = tierVal === 0 ? "Referral" : "Direct Upgrade";
          else if (rType === 2) eventName = "Layer Income";
          else if (rType === 3) eventName = "Matrix Income";

          const bnbAmount = ethers.formatEther(item[2] ?? item.amount ?? 0n);

          return {
            // FIX: Use index [0] as primary fallback — named .id can be undefined in some ethers builds
            from_node_id: Number(item[0] ?? item.id ?? 0),
            event_type: eventName,
            amount_bnb: bnbAmount,
            amount_usd: (parseFloat(bnbAmount) * bnbPrice).toFixed(2),
            timestamp: new Date(Number(item[3] ?? item.time ?? 0) * 1000).toISOString(),
            is_missed: Boolean(item[4] ?? item.isMissed ?? false),
            layer: Number(item[1] ?? item.layer ?? 0),
            tier: tierVal,
          };
        });
    } catch (err) {
      console.warn(
        "fetchTeamHistoryOnChain failed (AIPCore contract might not support getIncome if very old):",
        err.message,
      );
      return null; // Signals failure so we can fallback to API
    }
  }

  // ── WRITE ACTIONS ─────────────────────────────────────────────────────────

  async createNode(sponsorId = 1) {
    const signer = await getEthersSigner(config);
    if (!signer) throw new Error("Wallet not connected");
    const walletAddress = await signer.getAddress();
    const core = new ethers.Contract(CONTRACTS.AIPCORE, AIPCORE_ABI, signer);

    // SELF-HEAL: If DB missed the registration, the contract will revert with no reason.
    // Check on-chain first to gracefully recover and sync.
    const existingNodeId = await core.nodeId(walletAddress).catch(() => 0n);
    if (existingNodeId > 0n) {
      console.log("Self-healing: Node already exists on-chain", Number(existingNodeId));
      await api.confirmNode(walletAddress, Number(existingNodeId), 1, "0xsync").catch(() => {});
      return Number(existingNodeId);
    }

    // FIX: Index 0 = Tier 1 cost
    const cost = await core
      .getTierCost(0)
      .catch(() => ethers.parseEther("0.008"));
      
    // Add 5% buffer to prevent insufficient msg.value reverts due to oracle price fluctuations
    const bufferCost = (cost * 105n) / 100n;
    
    const tx = await core.createNode(sponsorId, { value: bufferCost, gasLimit: 3000000 });
    const receipt = await tx.wait();

    // Parse NodeCreated event to get the assigned nodeId
    let nid = 0;
    try {
      const iface = new ethers.Interface(AIPCORE_ABI);
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
          if (parsed?.name === 'NodeCreated') {
            nid = Number(parsed.args[1]); // userId = second indexed param
            break;
          }
        } catch { /* not this event */ }
      }
    } catch (e) {
      console.warn("NodeCreated event parse failed:", e.message);
    }

    if (nid > 0) {
      // Auto-register in Reward Pool
      try {
        const pool = new ethers.Contract(CONTRACTS.REWARDPOOL, REWARDPOOL_ABI, signer);
        await (await pool.registerNode(nid)).wait();
      } catch (e) {
        console.warn("Pool registration skipped:", e.message);
      }

      // ✅ INSTANT DB UPDATE — zero RPC on server side
      // Tier 1 is always the result of createNode()
      await api.confirmNode(walletAddress, nid, 1, receipt.hash).catch(() => {});

      return nid;
    }
    return 1;
  }

  async claimRewards() {
    const signer = await getEthersSigner(config);
    if (!signer) throw new Error("Wallet not connected");
    return (
      await new ethers.Contract(
        CONTRACTS.AIPCORE,
        AIPCORE_ABI,
        signer,
      ).withdraw()
    ).wait();
  }

  async claimPool(nodeId) {
    const signer = await getEthersSigner(config);
    if (!signer) throw new Error("Wallet not connected");
    return (
      await new ethers.Contract(
        CONTRACTS.REWARDPOOL,
        REWARDPOOL_ABI,
        signer,
      ).claim(nodeId)
    ).wait();
  }

  async registerPool(nodeId) {
    const signer = await getEthersSigner(config);
    if (!signer) throw new Error("Wallet not connected");
    return (
      await new ethers.Contract(
        CONTRACTS.REWARDPOOL,
        REWARDPOOL_ABI,
        signer,
      ).registerNode(nodeId)
    ).wait();
  }

  async unlockTier(nodeId, toTier) {
    const signer = await getEthersSigner(config);
    if (!signer) throw new Error("Wallet not connected");
    const walletAddress = await signer.getAddress();
    const core = new ethers.Contract(CONTRACTS.AIPCORE, AIPCORE_ABI, signer);
    
    // Fetch all tier costs and select the correct one (fallback to calculate if RPC fails)
    let cost;
    try {
      const costs = await core.getTierCosts();
      cost = costs[toTier - 1];
    } catch {
      // Fallback calculation if RPC call fails: 0.008 BNB base, roughly +20% per tier
      // Usually Tier 2 is 0.01 BNB, Tier 3 is 0.012 BNB, etc.
      const baseCost = 0.008;
      const calcCost = baseCost * Math.pow(1.2, toTier - 1);
      cost = ethers.parseEther(calcCost.toFixed(4).toString());
    }

    // Add a 5% buffer to prevent 'Low BNB' reverts if the oracle price updates 
    // exactly during our transaction, or if the fallback math is slightly off.
    // The smart contract automatically refunds any excess BNB sent.
    const bufferCost = (cost * 105n) / 100n;

    const tx = await core.unlockTier(nodeId, toTier, { value: bufferCost, gasLimit: 3000000 });
    const receipt = await tx.wait();

    // Parse TierUnlocked event to get the confirmed tier
    // event TierUnlocked(address indexed node, uint256 indexed userId, uint256 packageId)
    // packageId = the new tier index (1-based)
    let confirmedTier = toTier; // fallback to what we requested
    try {
      const iface = new ethers.Interface(AIPCORE_ABI);
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
          if (parsed?.name === 'TierUnlocked') {
            confirmedTier = Number(parsed.args[2]); // packageId = new tier
            break;
          }
        } catch { /* not this event */ }
      }
    } catch (e) {
      console.warn("TierUnlocked event parse failed:", e.message);
    }

    // ✅ INSTANT DB UPDATE — zero RPC on server side
    await api.confirmNode(walletAddress, nodeId, confirmedTier, receipt.hash).catch(() => {});

    return receipt;
  }

  // ── REPORTING ─────────────────────────────────────────────────────────────
  // ── REPORTING ─────────────────────────────────────────────────────────────
  async getReferralCounts(nodeId) {
    try {
      const calls = Array.from({ length: 18 }, (_, i) => ({
        target: CONTRACTS.AIPCORE,
        callData: this.core.interface.encodeFunctionData("getTeamSize", [nodeId, i])
      }));

      const [, returnData] = await this.multicall.aggregate(calls);
      
      return returnData.map(data => {
        try {
          return Number(this.core.interface.decodeFunctionResult("getTeamSize", data)[0]);
        } catch {
          return 0;
        }
      });
    } catch (err) {
      console.error("Multicall failed, falling back to sequential:", err);
      const counts = [];
      for(let i=0; i<18; i++) {
        const c = await this.core.getTeamSize(nodeId, i).catch(() => 0n);
        counts.push(Number(c));
      }
      return counts;
    }
  }

  async getMatrixLevelCounts(nodeId) {
    try {
      // Contract uses 0-indexed layers (Layer 0 = Level 1, Layer 17 = Level 18)
      // Split into two multicall batches to avoid block-gas / payload limits
      const batch1 = Array.from({ length: 9 }, (_, i) => ({
        target: CONTRACTS.AIPCORE,
        callData: this.core.interface.encodeFunctionData("getMatrixUsers", [nodeId, i, 0, 50])
      }));
      const batch2 = Array.from({ length: 9 }, (_, i) => ({
        target: CONTRACTS.AIPCORE,
        callData: this.core.interface.encodeFunctionData("getMatrixUsers", [nodeId, i + 9, 0, 50])
      }));

      const [[, data1], [, data2]] = await Promise.all([
        this.multicall.aggregate(batch1),
        this.multicall.aggregate(batch2),
      ]);

      const matrixCounts = new Array(18).fill(0);
      [...data1, ...data2].forEach((data, i) => {
        try {
          const members = this.core.interface.decodeFunctionResult("getMatrixUsers", data)[0];
          matrixCounts[i] = members.length;
        } catch {
          matrixCounts[i] = 0;
        }
      });
      return matrixCounts;
    } catch (err) {
      console.error("Matrix count multicall failed:", err);
      return new Array(18).fill(0);
    }
  }


  async getDirectReferrals(nodeId, num = 100) {
    try {
      if (!nodeId || Number(nodeId) === 0) return [];
      const members = await this.core.getNetworkNodes(nodeId, 0, num);
      return members.map(m => ({
        wallet_address: m.wallet,
        nodeId: Number(m.nodeId), // raw nodeId for MemberCard component mapping
        node_id: Number(m.nodeId), // db standard mapping
        node_tier: Number(m.tier),
        joined_at: Number(m.joinedAt),
        joinedAt: Number(m.joinedAt),
        direct_count: Number(m.directNodes),
        team_size: Number(m.totalMatrixNodes),
        node_active: true,
        is_direct: true
      }));
    } catch (err) {
      console.warn("getDirectReferrals failed:", err.message);
      return [];
    }
  }

  async getMatrixMembers(nodeId, layer, num = 50) {
    const members = await this.core.getMatrixUsers(nodeId, layer, 0, num);
    const basic = members.map((m) => ({
      wallet: m.wallet,
      nodeId: Number(m.nodeId),
      sponsor: Number(m.sponsor),
      tier: Number(m.tier),
      joinedAt: Number(m.joinedAt),
    }));

    if (basic.length === 0) return basic;

    // Enrich with per-member stats (directs + sub-team) via a single multicall batch
    try {
      const calls = basic.map(m => ({
        target: CONTRACTS.AIPCORE,
        callData: this.core.interface.encodeFunctionData("getNodeStats", [m.nodeId])
      }));
      const [, returnData] = await this.multicall.aggregate(calls);
      return basic.map((m, i) => {
        try {
          const decoded = this.core.interface.decodeFunctionResult("getNodeStats", returnData[i]);
          // getNodeStats → [tier, directCount, matrixCount, totalRewards, totalContribution, daysActive]
          return {
            ...m,
            directNodes:      Number(decoded[1] || 0), // directCount
            totalMatrixNodes: Number(decoded[2] || 0), // matrixCount (sub-team)
          };
        } catch {
          return { ...m, directNodes: 0, totalMatrixNodes: 0 };
        }
      });
    } catch (err) {
      console.warn("Member stats multicall failed, using plain list:", err.message);
      return basic.map(m => ({ ...m, directNodes: 0, totalMatrixNodes: 0 }));
    }
  }
}

export const blockchain = new BlockchainService();
