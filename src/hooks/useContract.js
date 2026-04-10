import { useMemo, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { blockchain } from '../services/blockchain.js';
import { useGameStore } from "../store/gameStore.js";
import toast from "react-hot-toast";

/**
 * AIPCore Contract Hook (Clean Wrapper)
 */
export const useContract = () => {
  const setNodeData = useGameStore(s => s.setNodeData);
  const updateChainData = useGameStore(s => s.updateChainData);
  const setBnbBalance = useGameStore(s => s.setBnbBalance);
  
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();

  const loadNodeData = async (address, retries = 3) => {
    if (!address) return;
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

  const fetchBnbBalance = async (address) => {
    if (!address) return;
    const bal = await blockchain.getBnbBalance(address);
    setBnbBalance(parseFloat(bal).toFixed(4));
    return bal;
  };

  return useMemo(() => ({
    loadNodeData, fetchBnbBalance, 
    connectWallet: () => openConnectModal?.(),
    disconnectWallet: () => disconnect(),
    createNode: async (sponsorId = 1) => {
      const tid = toast.loading("Activating Node...");
      try {
        const nid = await blockchain.createNode(sponsorId);
        toast.success("🚀 Node Activated!", { id: tid });
        return nid;
      } catch (e) {
        toast.error(e.message || "Activation failed", { id: tid });
        return false;
      }
    },
    claimRewards: async () => {
      const tid = toast.loading("Withdrawing rewards...");
      try {
        await blockchain.claimRewards();
        toast.success("✅ Rewards claimed!", { id: tid });
        return true;
      } catch (e) {
        toast.error("Claim failed", { id: tid });
        return false;
      }
    },
    unlockTier: async (nodeId, toTier) => {
      const tid = toast.loading(`Upgrading to Level ${toTier}...`);
      try {
        await blockchain.unlockTier(nodeId, toTier);
        toast.success(`🚀 Level ${toTier} Unlocked!`, { id: tid });
        return true;
      } catch (e) {
        toast.error("Upgrade failed", { id: tid });
        return false;
      }
    },
    fetchTeamCounts: (nid) => blockchain.getMatrixCounts(nid),
    fetchTeamLevelMembers: (nid, layer) => blockchain.getMatrixMembers(nid, layer)
  }), [setNodeData, updateChainData, setBnbBalance, openConnectModal, disconnect]);
};

export const useWalletLifecycle = () => {
  const { address, isConnected } = useAccount();
  const { setWallet, disconnectWallet, fetchUserData, fetchAdminStatus } = useGameStore();
  const { loadNodeData, fetchBnbBalance } = useContract();

  useEffect(() => {
    if (isConnected && address) {
      setWallet(address);
      loadNodeData(address);
      fetchBnbBalance(address);
      fetchAdminStatus(); // Check for owner privileges
      fetchUserData().catch(() => {}); // Sync backend state on connect
    } else if (!isConnected) {
      disconnectWallet();
    }
  }, [isConnected, address, fetchUserData]);

  return {
    setupListeners: () => {}, 
    removeListeners: () => {}
  };
};
