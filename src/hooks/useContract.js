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
          totalEarned:    parseFloat(data.totalEarned),
          teamSize:       data.teamSize,
          directRefs:     data.directRefs,
          pendingReward:  parseFloat(data.pendingReward),
          poolClaimable:  parseFloat(data.poolClaimable),
          poolName:       data.poolName || 'None',
          totalDeposited: parseFloat(data.totalDeposited || 0),
          missingDirects: data.missingDirects || 0,
          missingTier:    data.missingTier    || 0,
          missingTeam:    data.missingTeam    || 0,
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
      const tid = toast.loading("Estimating activation cost...");
      try {
        // Pre-flight: check user has enough BNB for gas + cost
        const bal = await blockchain.getBnbBalance(
          (await import('wagmi/actions')).getAccount(await import('../config/wagmi.js').then(m => m.config)).address
        );
        const nid = await blockchain.createNode(sponsorId);
        toast.success("🚀 Node Activated! Welcome to the Protocol.", { id: tid, duration: 5000 });
        return nid;
      } catch (e) {
        // Friendly insufficient funds error
        if (
          e?.message?.includes('insufficient funds') ||
          e?.message?.includes('INSUFFICIENT_FUNDS') ||
          e?.code === -32000
        ) {
          toast.error(
            '⚠️ Not enough BNB — Fund your wallet to activate.',
            { id: tid, duration: 8000 }
          );
        } else if (e?.code === 4001 || e?.message?.includes('rejected')) {
          toast.error('Transaction cancelled.', { id: tid });
        } else {
          toast.error(e?.shortMessage || e?.message || 'Activation failed.', { id: tid });
        }
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
  const { setWallet, disconnectWallet, fetchUserData, fetchAdminStatus, fetchUserConversions } = useGameStore();
  const { loadNodeData, fetchBnbBalance } = useContract();

  useEffect(() => {
    if (isConnected && address) {
      setWallet(address);
      loadNodeData(address);
      fetchBnbBalance(address);
      fetchAdminStatus(); // Check for owner privileges
      fetchUserConversions(); // Load payout history
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
