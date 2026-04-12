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
  const setProcessing = useGameStore(s => s.setProcessing);
  
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
        return data.nodeId; // Return nodeId for downstream chaining
      } else {
        setNodeData({ nodeId: 0, tier: 0, active: false });
        return 0;
      }
    } catch (err) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 2000));
        return loadNodeData(address, retries - 1);
      }
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
      setProcessing(true, "Activating Node...");
      try {
        // Pre-flight: check user has enough BNB for gas + cost
        const bal = await blockchain.getBnbBalance(
          (await import('wagmi/actions')).getAccount(await import('../config/wagmi.js').then(m => m.config)).address
        );
        const nid = await blockchain.createNode(sponsorId);
        toast.success("🚀 Node Activated! Welcome to the Protocol.", { id: tid, duration: 5000 });
        setProcessing(false);
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
          let errMsg = e?.shortMessage || e?.message || 'Activation failed.';
        if (errMsg.toLowerCase().includes('insufficient funds')) {
          errMsg = 'Insufficient BNB balance for transaction & gas.';
        } else if (errMsg.includes('user rejected')) {
          errMsg = 'Transaction rejected by user.';
        } else {
          errMsg = errMsg.slice(0, 80);
        }
        toast.error(errMsg, { id: tid });
        }
        setProcessing(false);
        return false;
      }
    },
    claimRewards: async () => {
      const tid = toast.loading("Withdrawing rewards...");
      setProcessing(true, "Withdrawing Rewards...");
      try {
        await blockchain.claimRewards();
        toast.success("✅ Rewards claimed!", { id: tid });
        setProcessing(false);
        return true;
      } catch (e) {
        toast.error("Claim failed", { id: tid });
        setProcessing(false);
        return false;
      }
    },
    unlockTier: async (nodeId, toTier) => {
      const tid = toast.loading(`Upgrading to Level ${toTier}...`);
      setProcessing(true, `Upgrading to Level ${toTier}...`);
      try {
        await blockchain.unlockTier(nodeId, toTier);
        toast.success(`🚀 Level ${toTier} Unlocked!`, { id: tid });
        setProcessing(false);
        return true;
      } catch (e) {
        toast.error("Upgrade failed", { id: tid });
        setProcessing(false);
        return false;
      }
    },
    fetchTeamCounts: (nid) => blockchain.getMatrixCounts(nid),
    fetchTeamLevelMembers: (nid, layer) => blockchain.getMatrixMembers(nid, layer)
  }), [setNodeData, updateChainData, setBnbBalance, openConnectModal, disconnect]);
};

export const useWalletLifecycle = () => {
  const { address, isConnected } = useAccount();
  const { setWallet, disconnectWallet, fetchUserData, fetchAdminStatus, fetchUserConversions, fetchTeamHistory } = useGameStore();
  const { loadNodeData, fetchBnbBalance } = useContract();

  useEffect(() => {
    if (isConnected && address) {
      // 1. Critical Actions (Immediate)
      setWallet(address);
      fetchBnbBalance(address);
      
      // Load critical node data (Dashboard stats)
      loadNodeData(address).then((nId) => {
        // Only fetch team history if we have a nodeId, and do it after a small delay
        if (nId > 0) {
          setTimeout(() => fetchTeamHistory(), 1500);
        }
      }).catch(() => {
        setTimeout(() => fetchTeamHistory(), 2000);
      });

      // 2. Secondary Actions (Delayed to prevent RPC/API congestion)
      setTimeout(() => {
        fetchUserData().catch(() => {});
        fetchAdminStatus();
        fetchUserConversions();
      }, 3000);

    } else if (!isConnected) {
      disconnectWallet();
    }
  }, [isConnected, address, fetchUserData]);

  return {
    setupListeners: () => {}, 
    removeListeners: () => {}
  };
};
