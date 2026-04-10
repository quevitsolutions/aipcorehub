import { ethers } from "ethers";
import { CONTRACTS, RPC_NODES } from "../config/constants.js";
import { AIPCORE_ABI, REWARDPOOL_ABI } from "../../contracts/abi.js";
import { config } from "../config/wagmi.js";
import { getEthersProvider, getEthersSigner } from "../utils/ethers-adapter.js";

/**
 * AIPCore Blockchain Service (Ethers v6) - Refactored for RainbowKit/Wagmi
 */
class BlockchainService {
  constructor() {
    // Default Read-only Provider (Static for initial loads)
    this.staticProvider = new ethers.JsonRpcProvider(RPC_NODES[0]);
    this.core = new ethers.Contract(CONTRACTS.AIPCORE, AIPCORE_ABI, this.staticProvider);
    this.pool = new ethers.Contract(CONTRACTS.REWARDPOOL, REWARDPOOL_ABI, this.staticProvider);
  }

  // Helper to get the most relevant provider (Wagmi-optimized)
  _getProvider() {
    return getEthersProvider(config) || this.staticProvider;
  }

  async getOwner() {
    return this.core.owner();
  }

  // Optimized hydration in one trip
  async getFullDashboardData(address) {
    try {
      const nId = await this.core.nodeId(address);
      if (!nId || Number(nId) === 0) return { nodeId: 0, hasNode: false };

      // Batch fetch: getNodeStats for tier/counts (positional, reliable), plus active/rewards
      const [stats, nodeInfo, isActive, pending, poolData] = await Promise.all([
        this.core.getNodeStats(nId),          // [tier, directCount, matrixCount, totalRewards, totalContribution, daysActive]
        this.core.nodes(nId).catch(() => null), // raw node struct for fallback
        this.core.isNodeActive(nId),
        this.core.pendingReward(address),
        this.pool.getPoolViewHelper(nId)
      ]);

      // stats[0] = tier (positional — reliable with ethers v6)
      const tier = Number(stats[0]);

      return {
        hasNode: true,
        nodeId:         Number(nId),
        tier:           tier > 0 ? tier : (nodeInfo ? Number(nodeInfo[5] ?? nodeInfo.tier ?? 1) : 1),
        directRefs:     Number(stats[1]),
        teamSize:       Number(stats[2]),
        totalEarned:    ethers.formatEther(stats[3]),
        nodeActive:     isActive,
        pendingReward:  ethers.formatEther(pending),
        poolClaimable:  ethers.formatEther(poolData[2]),
        poolName:       String(poolData[1] || 'None'),
        totalDeposited: ethers.formatEther(poolData[7] || 0n),
        isPoolQualified: Boolean(poolData[9]),
        // missingRequirements[0]=directs, [1]=tier, [2]=team
        missingDirects: Number(poolData[11]?.[0] || 0),
        missingTier:    Number(poolData[11]?.[1] || 0),
        missingTeam:    Number(poolData[11]?.[2] || 0),
      };
    } catch (err) {
      console.error("Dashboard Data Fetch Failed:", err);
      throw err;
    }
  }

  async getBnbBalance(address) {
    const p = this._getProvider();
    const bal = await p.getBalance(address);
    return ethers.formatEther(bal);
  }

  // --- WRITE ACTIONS ---

  async createNode(sponsorId = 1) {
    const signer = await getEthersSigner(config);
    if (!signer) throw new Error("Wallet not connected");
    const core = new ethers.Contract(CONTRACTS.AIPCORE, AIPCORE_ABI, signer);
    const cost = await core.getTierCost(1).catch(() => ethers.parseEther("0.05"));
    const tx = await core.createNode(sponsorId, { value: cost });
    const receipt = await tx.wait();

    // Secondary: Pool registration
    try {
      const pool = new ethers.Contract(CONTRACTS.REWARDPOOL, REWARDPOOL_ABI, signer);
      const nodeLog = receipt.logs[0];
      const nid = nodeLog ? Number(nodeLog.topics[1]) : 0;
      if (nid > 0) {
        const tx2 = await pool.registerNode(nid);
        await tx2.wait();
        return nid;
      }
    } catch (e) {
      console.warn("Pool registration skipped/failed:", e.message);
    }
    return 1; // Default fallback
  }

  async claimRewards() {
    const signer = await getEthersSigner(config);
    if (!signer) throw new Error("Wallet not connected");
    const core = new ethers.Contract(CONTRACTS.AIPCORE, AIPCORE_ABI, signer);
    const tx = await core.withdraw();
    return tx.wait();
  }

  async claimPool(nodeId) {
    const signer = await getEthersSigner(config);
    if (!signer) throw new Error("Wallet not connected");
    const pool = new ethers.Contract(CONTRACTS.REWARDPOOL, REWARDPOOL_ABI, signer);
    const tx = await pool.claim(nodeId);
    return tx.wait();
  }

  async unlockTier(nodeId, toTier) {
    const signer = await getEthersSigner(config);
    if (!signer) throw new Error("Wallet not connected");
    const core = new ethers.Contract(CONTRACTS.AIPCORE, AIPCORE_ABI, signer);
    const cost = await core.getTierCost(toTier - 1);
    const tx = await core.unlockTier(nodeId, toTier, { value: cost });
    return tx.wait();
  }

  // --- REPORTING ACTIONS ---

  async getMatrixCounts(nodeId) {
    // Consolidated matrix users fetch
    const promises = Array.from({ length: 18 }, (_, i) => this.core.getMatrixUsers(nodeId, i, 0, Math.pow(2, i + 1)));
    const results = await Promise.allSettled(promises);
    return results.map(r => r.status === 'fulfilled' ? r.value.length : 0);
  }

  async getMatrixMembers(nodeId, layer, num = 50) {
    const members = await this.core.getMatrixUsers(nodeId, layer, 0, num);
    return members.map(m => ({
      wallet: m.wallet,
      nodeId: Number(m.nodeId),
      tier: Number(m.tier),
      joinedAt: Number(m.joinedAt)
    }));
  }
}

export const blockchain = new BlockchainService();
