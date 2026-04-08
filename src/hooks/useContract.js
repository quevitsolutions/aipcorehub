import { useMemo } from 'react';
import { blockchain } from '../services/blockchain.js';
import { useGameStore } from "../store/gameStore.js";
import toast from "react-hot-toast";

/**
 * AIPCore Contract Hook (Clean Wrapper)
 * Acts as a bridge between the UI and the Blockchain Service
 */
export const useContract = () => {
  const setNodeData = useGameStore(s => s.setNodeData);
  const updateChainData = useGameStore(s => s.updateChainData);
  const setWallet = useGameStore(s => s.setWallet);
  const setBnbBalance = useGameStore(s => s.setBnbBalance);

  const connectWallet = async () => {
    try {
      const address = await blockchain.getWriteContract(null, null, true).then(s => s.runner.address); // Simplified helper
      // Wait actually, let's keep it simple
      const signer = await blockchain.getWriteContract(null, null, true).then(s => s.signer);
      // Let's stick to the previous config helpers for connection
      return await blockchain.getBnbBalance("placeholder"); // This is just a draft
    } catch (e) {
      console.warn("Connect wallet wrapper logic TBD");
    }
  };

  // RE-IMPLEMENTED FOR CLEANLINESS
  const loadNodeData = async (address, retries = 3) => {
    try {
      const data = await blockchain.getFullDashboardData(address);
      if (data.hasNode) {
        setNodeData({ nodeId: data.nodeId, tier: data.tier, active: data.nodeActive });
        updateChainData({
          totalEarned: parseFloat(data.totalEarned),
          teamSize: data.teamSize,
          directRefs: data.directRefs,
          pendingReward: parseFloat(data.pendingReward),
          poolClaimable: parseFloat(data.poolClaimable)
        });
      } else {
        setNodeData({ nodeId: 0, tier: 0, active: false });
      }
    } catch (err) {
      if (retries > 0) setTimeout(() => loadNodeData(address, retries - 1), 2000);
    }
  };

  const createNode = async (sponsorId = 1) => {
    const tid = toast.loading("Activating Node...");
    try {
      const nid = await blockchain.createNode(sponsorId);
      toast.success("🚀 Node Activated!", { id: tid });
      return nid;
    } catch (e) {
      toast.error(e.reason || "Activation failed", { id: tid });
      return false;
    }
  };

  const claimRewards = async () => {
    const tid = toast.loading("Withdrawing rewards...");
    try {
      await blockchain.claimRewards();
      toast.success("✅ Rewards claimed!", { id: tid });
      return true;
    } catch (e) {
      toast.error("Claim failed", { id: tid });
      return false;
    }
  };

  const unlockTier = async (nodeId, toTier) => {
    const tid = toast.loading(`Upgrading to Level ${toTier}...`);
    try {
      await blockchain.unlockTier(nodeId, toTier);
      toast.success(`🚀 Level ${toTier} Unlocked!`, { id: tid });
      return true;
    } catch (e) {
      toast.error("Upgrade failed", { id: tid });
      return false;
    }
  };

  const fetchBnbBalance = async (address) => {
    const bal = await blockchain.getBnbBalance(address);
    setBnbBalance(parseFloat(bal).toFixed(4));
    return bal;
  };

  return useMemo(() => ({
    loadNodeData, createNode, claimRewards, unlockTier, fetchBnbBalance,
    fetchTeamCounts: (nid) => blockchain.getMatrixCounts(nid),
    fetchTeamLevelMembers: (nid, layer) => blockchain.getMatrixMembers(nid, layer)
  }), [setNodeData, updateChainData, setBnbBalance]);
};

export const useWalletLifecycle = () => {
  const { setWallet, disconnectWallet } = useGameStore();
  const { loadNodeData, fetchBnbBalance } = useContract();

  const handleAccountsChanged = async (accs) => {
    if (accs.length > 0) {
      setWallet(accs[0]);
      await Promise.all([loadNodeData(accs[0]), fetchBnbBalance(accs[0])]);
    } else {
      disconnectWallet();
    }
  };

  return {
    setupListeners: () => window.ethereum?.on('accountsChanged', handleAccountsChanged),
    removeListeners: () => window.ethereum?.removeListener('accountsChanged', handleAccountsChanged)
  };
};
