import { ethers } from "ethers";
import { CONTRACTS, RPC_NODES } from "../config/constants.js";
import {
  AIPCORE_ABI,
  AIPVIEW_ABI,
  REWARDPOOL_ABI,
} from "../../contracts/abi.js";

const MULTICALL_ABI = [
  "function aggregate(tuple(address target, bytes callData)[] calls) view returns (uint256 blockNumber, bytes[] returnData)"
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
    this.staticProvider = new ethers.JsonRpcProvider(RPC_NODES[0]);
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

      // All calls are isolated — one failure cannot break others
      const [viewStats, coreStats, nodeRaw, isActive, pending, poolData, viewBreakdown, poolClaimableData] =
        await Promise.all([
          this.view.getNodeStats(nId).catch(() => null),         // AIPVIEW  → [totalEarned, teamSize, directRefs, level]
          this.core.getNodeStats(nId).catch(() => null),         // AIPCORE  → [tier, directCount, matrixCount, ...]
          this.core.nodes(nId).catch(() => null),                // raw struct → index 5 = tier
          this.core.isNodeActive(nId).catch(() => false),
          this.core.pendingReward(address).catch(() => 0n),      // AIPCORE pending (by wallet)
          this.pool.getPoolViewHelper(nId).catch(() => null),    // full pool view
          this.view.getIncomeBreakdown(nId).catch(() => null),   // AIPVIEW → [direct,matrix,pool,pending] ← more accurate pending
          this.pool.getClaimable(nId).catch(() => null),         // REWARDPOOL → [fromCurrentPool,fromExited,total] ← direct claimable
        ]);

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
        totalDeposited:   ethers.formatEther(poolData?.[7] || 0n),
        isPoolQualified:  Boolean(poolData?.[9]),
        totalPoolEarned:  ethers.formatEther(poolData?.[3] || 0n),
        totalPoolClaimed: ethers.formatEther(poolData?.[4] || 0n),
        remainingCap:     ethers.formatEther(poolData?.[5] || 0n),   // cap remaining
        lifetimeCap:      ethers.formatEther(poolData?.[6] || 0n),   // total lifetime cap
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

      return historyItems.map((item) => {
        const rType = Number(item.rewardType);
        const tierVal = Number(item.tier);
        let eventName = "Team Reward";

        if (rType === 1)
          eventName = tierVal === 0 ? "Referral" : "Direct Upgrade";
        else if (rType === 2) eventName = "Layer Income";
        else if (rType === 3) eventName = "Matrix Income";

        const bnbAmount = ethers.formatEther(item.amount);

        return {
          from_node_id: Number(item.id),
          event_type: eventName,
          amount_bnb: bnbAmount,
          amount_usd: (parseFloat(bnbAmount) * bnbPrice).toFixed(2),
          timestamp: new Date(Number(item.time) * 1000).toISOString(),
          is_missed: item.isMissed,
          layer: Number(item.layer),
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
    const core = new ethers.Contract(CONTRACTS.AIPCORE, AIPCORE_ABI, signer);
    const cost = await core
      .getTierCost(1)
      .catch(() => ethers.parseEther("0.05"));
    const tx = await core.createNode(sponsorId, { value: cost });
    const receipt = await tx.wait();

    try {
      const pool = new ethers.Contract(
        CONTRACTS.REWARDPOOL,
        REWARDPOOL_ABI,
        signer,
      );
      const nodeLog = receipt.logs[0];
      const nid = nodeLog ? Number(nodeLog.topics[1]) : 0;
      if (nid > 0) {
        await (await pool.registerNode(nid)).wait();
        return nid;
      }
    } catch (e) {
      console.warn("Pool registration skipped:", e.message);
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
    const core = new ethers.Contract(CONTRACTS.AIPCORE, AIPCORE_ABI, signer);
    const cost = await core.getTierCost(toTier - 1);
    return (await core.unlockTier(nodeId, toTier, { value: cost })).wait();
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
      // Fetch matrix counts by checking getMatrixUsers for each level
      // Contract uses 0-indexed layers (Layer 0 = Level 1)
      const layers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const calls = layers.map(layer => ({
        target: CONTRACTS.AIPCORE,
        // Safe limit to ensure the gasless view call doesn't timeout or exceed block limits
        callData: this.core.interface.encodeFunctionData("getMatrixUsers", [nodeId, layer, 0, 100])
      }));

      const [, returnData] = await this.multicall.aggregate(calls);
      
      const matrixCounts = new Array(18).fill(0);
      returnData.forEach((data, i) => {
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

  async getMatrixMembers(nodeId, layer, num = 50) {
    const members = await this.core.getMatrixUsers(nodeId, layer, 0, num);
    const basic = members.map((m) => ({
      wallet: m.wallet,
      nodeId: Number(m.nodeId),
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
