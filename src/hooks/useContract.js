import { useMemo, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { blockchain } from '../services/blockchain.js';
import { useGameStore } from "../store/gameStore.js";
import toast from "react-hot-toast";
import { loadNodeData, fetchBnbBalance } from '../services/nodeService.js';

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
  const isWeb3Connected = useGameStore(s => s.isWeb3Connected);



  return useMemo(() => ({
    loadNodeData, fetchBnbBalance, 
    connectWallet: () => openConnectModal?.(),
    disconnectWallet: () => disconnect(),
    createNode: async (sponsorId = 1) => {
      if (!isWeb3Connected) {
        toast.error("Please connect your Web3 wallet to activate a Node.");
        openConnectModal?.();
        return false;
      }
      const tid = toast.loading("Activating Node...");
      setProcessing(true, "Activating Node...");
      try {
        // blockchain.createNode() now calls api.confirmNode() internally
        // DB is updated before this line returns — no extra fetch needed
        const nid = await blockchain.createNode(sponsorId);

        const walletAddress = useGameStore.getState().walletAddress;
        if (walletAddress && nid > 0) {
          // Force-repair tree links (sponsor counts etc)
          fetch(`${import.meta.env.VITE_API_URL || ''}/api/network/force-repair`, {
            method: 'POST'
          }).catch(() => {});

          // DB already has correct nodeId+tier — refresh store immediately (no delay)
          useGameStore.setState({ lastBackendSync: null });
          Promise.all([
            useGameStore.getState().fetchUserData(),
            loadNodeData(walletAddress),
            fetchBnbBalance(walletAddress),
          ]).catch(() => {});
        }

        toast.success("🚀 Node Activated! Welcome to the Protocol.", { id: tid, duration: 5000 });
        setProcessing(false);
        return nid;
      } catch (e) {
        if (
          e?.message?.includes('insufficient funds') ||
          e?.message?.includes('INSUFFICIENT_FUNDS') ||
          e?.code === -32000
        ) {
          toast.error('⚠️ Not enough BNB — Fund your wallet to activate.', { id: tid, duration: 8000 });
        } else if (e?.code === 4001 || e?.message?.includes('rejected')) {
          toast.error('Transaction cancelled.', { id: tid });
        } else {
          let errMsg = e?.shortMessage || e?.message || 'Activation failed.';
          if (errMsg.toLowerCase().includes('insufficient funds')) errMsg = 'Insufficient BNB balance for transaction & gas.';
          else if (errMsg.includes('user rejected')) errMsg = 'Transaction rejected by user.';
          else errMsg = errMsg.slice(0, 80);
          toast.error(errMsg, { id: tid });
        }
        setProcessing(false);
        return false;
      }
    },
    claimRewards: async () => {
      if (!isWeb3Connected) {
        toast.error("Please connect your Web3 wallet to withdraw rewards.");
        openConnectModal?.();
        return false;
      }
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
    claimPool: async (nodeId) => {
      if (!isWeb3Connected) {
        toast.error("Please connect your Web3 wallet to claim pool rewards.");
        openConnectModal?.();
        return false;
      }
      if (!nodeId) return;
      const tid = toast.loading("Claiming Pool Rewards...");
      setProcessing(true, "Claiming Pool...");
      try {
        await blockchain.claimPool(nodeId);
        toast.success("✅ Pool Rewards Claimed!", { id: tid });
        const walletAddress = useGameStore.getState().walletAddress;
        setTimeout(() => loadNodeData(walletAddress), 1500);
        setProcessing(false);
        return true;
      } catch (e) {
        toast.error("Claim failed: " + e.message.slice(0, 40), { id: tid });
        setProcessing(false);
        return false;
      }
    },
    registerPool: async (nodeId) => {
      if (!isWeb3Connected) {
        toast.error("Please connect your Web3 wallet to register for the reward pool.");
        openConnectModal?.();
        return false;
      }
      if (!nodeId) return;
      const tid = toast.loading("Registering into Reward Pool...");
      setProcessing(true, "Registering...");
      try {
        await blockchain.registerPool(nodeId);
        toast.success("🏆 Successfully registered for the Reward Pool!", { id: tid });
        const walletAddress = useGameStore.getState().walletAddress;
        setTimeout(() => loadNodeData(walletAddress), 1500);
        setProcessing(false);
        return true;
      } catch (e) {
        let msg = e.message;
        if (msg.includes("insufficient funds")) msg = "Insufficient BNB to pay gas for registration.";
        toast.error("Registration failed: " + msg.slice(0, 50), { id: tid });
        setProcessing(false);
        return false;
      }
    },
    unlockTier: async (nodeId, toTier) => {
      if (!isWeb3Connected) {
        toast.error("Please connect your Web3 wallet to upgrade node tier.");
        openConnectModal?.();
        return false;
      }
      if (!nodeId) return toast.error('Node ID missing — reconnect wallet') && false;
      const tid = toast.loading(`Upgrading to Tier ${toTier}...`);
      setProcessing(true, `Upgrading to Tier ${toTier}...`);
      try {
        // blockchain.unlockTier() calls api.confirmNode() internally
        // DB has the new tier by the time this await resolves
        await blockchain.unlockTier(nodeId, toTier);

        const walletAddress = useGameStore.getState().walletAddress;
        if (walletAddress) {
          // DB already updated — reset sync timestamp so fetchUserData re-reads fresh
          useGameStore.setState({ lastBackendSync: null });
          Promise.all([
            useGameStore.getState().fetchUserData(),
            loadNodeData(walletAddress),
            fetchBnbBalance(walletAddress),
          ]).catch(() => {});
        }

        toast.success(`🚀 Tier ${toTier} Unlocked! Mining rate updated.`, { id: tid, duration: 5000 });
        setProcessing(false);
        return true;
      } catch (e) {
        if (e?.message?.includes('insufficient funds') || e?.code === -32000) {
          toast.error('⚠️ Not enough BNB for this upgrade.', { id: tid, duration: 8000 });
        } else if (e?.code === 4001 || e?.message?.includes('rejected')) {
          toast.error('Transaction cancelled.', { id: tid });
        } else {
          toast.error(e?.shortMessage || e?.message?.slice(0, 80) || 'Upgrade failed', { id: tid });
        }
        setProcessing(false);
        return false;
      }
    },
    fetchTeamCounts: (nid) => blockchain.getReferralCounts(nid),
    fetchMatrixCounts: (nid) => blockchain.getMatrixLevelCounts(nid),
    fetchTeamLevelMembers: (nid, layer) => blockchain.getMatrixMembers(nid, layer),
    fetchDirectMembers: (nid) => blockchain.getDirectReferrals(nid)
  }), [openConnectModal, disconnect]);
};

export const useWalletLifecycle = () => {
  const { address, isConnected, status } = useAccount();
  const { setWallet, disconnectWallet, fetchUserData, fetchAdminStatus, fetchUserConversions, fetchTeamHistory } = useGameStore();

  useEffect(() => {
    // STABILITY FIX: Accept both 'connected' AND 'reconnecting' status.
    // On page refresh with a saved wallet, Wagmi starts as 'reconnecting' — blocking
    // on 'connected' only means fetchUserData never fires and the app shows all nulls.
    // Block only 'connecting' (unconfirmed first-connect attempt).
    if (!isConnected || !address || status === 'connecting') return;

    // Set wallet first (synchronous)
    setWallet(address);
    if (typeof document !== 'undefined') {
      document.cookie = "wallet_connected=true; path=/; max-age=31536000; SameSite=Lax; Secure";
    }

    // Parallel: fire all DB fetches immediately — no delay
    Promise.all([
      fetchUserData(),
      fetchAdminStatus(),
      fetchUserConversions(),
      fetchBnbBalance(address),
    ]).catch(() => {});

    // Background: blockchain RPC (slower, non-critical for initial render)
    loadNodeData(address).then((nId) => {
      if (nId > 0) setTimeout(() => fetchTeamHistory(), 1000);
    }).catch(() => {});

  }, [isConnected, address, status]);

  // Separate disconnect handler — isolated to prevent re-runs on status flicker
  useEffect(() => {
    if (status === 'disconnected') {
      disconnectWallet();
      if (typeof document !== 'undefined') {
        document.cookie = "wallet_connected=; path=/; max-age=0; SameSite=Lax; Secure";
      }
    }
  }, [status]);

  return {
    setupListeners: () => {}, 
    removeListeners: () => {}
  };
};
