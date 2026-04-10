import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../services/api.js';

const DEMO_TAP_LIMIT = 20;
const MAX_ENERGY = 500;
const ENERGY_REGEN_INTERVAL = 3000; // ms per 1 energy
const BASE_MINING_RATE = 1000;

export const useGameStore = create(
  persist(
    (set, get) => ({
      // Wallet
      walletAddress: null,
      isConnected: false,
      bnbBalance: '0.00',
      isAdmin: false,
      leaderboard: [],
      referralList: [],
      adminStats: null,
      snapshotHistory: [],
 
      // Backend Sync
      isSyncing: false,
      lastBackendSync: null,

      // Node
      hasNode: false,
      nodeId: null,
      nodeTier: 0,
      isPremium: false,
      nodeActive: false,

      // Tap engine
      taps: 0,
      demoTaps: 0,
      localReward: 0,
      energy: MAX_ENERGY,
      maxEnergy: MAX_ENERGY,
      miningRate: BASE_MINING_RATE,
      isLocked: false,
      showNodePopup: false,

      // Earnings
      totalEarned: 0,
      pendingReward: 0,
      teamSize: 0,
      directRefs: 0,
      poolClaimable: 0,

      // Streak
      streak: 0,
      lastClaimDate: null,
      showDailyPopup: false,

      // Mining Logic
      lastClaimTime: Date.now(),
      pendingMined: 0,

      // Pool Qualification
      poolQual: {
        poolName: 'None',
        isQualified: false,
        nextPoolId: 0,
        totalDeposited: 0,
        missingDirects: 0,
        missingTier: 0,
        missingTeam: 0,
        totalEarned: 0,
        remainingCap: 0
      },

      // UI
      activeTab: 'earn',
      showUpgradePopup: false,

      // Referral
      referrerId: null,
      referralCode: null,

      // Actions
      setWallet: (address) => set({ 
        walletAddress: address, 
        isConnected: !!address,
        // Reset node data if disconnecting
        ...(address ? {} : { hasNode: false, nodeId: null, nodeTier: 0, nodeActive: false })
      }),

      setBnbBalance: (balance) => set({ bnbBalance: balance }),

      disconnectWallet: () => {
        set({
          walletAddress: null,
          isConnected: false,
          bnbBalance: '0.00',
          hasNode: false,
          nodeId: null,
          nodeTier: 0,
          nodeActive: false
        });
        localStorage.removeItem('aipcore-game-state');
      },

      setNodeData: (data) => {
        // Raw tier from contract (1 to 18)
        const tier = (data.tier !== undefined) ? Number(data.tier) : 1;
        
        // GEOMETRIC MINING: 1000 * 2^(tier-1)
        const newMiningRate = 1000 * Math.pow(2, Math.max(0, tier - 1));
        const newMaxEnergy = 500 + (tier - 1) * 200;
        
        const isActuallyActive = data.nodeId && Number(data.nodeId) > 0;

        set({
          hasNode: isActuallyActive,
          nodeId: isActuallyActive ? Number(data.nodeId) : null,
          nodeTier: isActuallyActive ? tier : 0,
          nodeActive: data.active,
          miningRate: newMiningRate,
          maxEnergy: newMaxEnergy,
          energy: Math.min(newMaxEnergy, get().energy),
          isLocked: !isActuallyActive,
          demoTaps: 0
        });
      },

      handleTap: () => {
        const state = get();
        if (state.energy <= 0) return { status: 'NO_ENERGY' };
 
        if (!state.hasNode) {
          if (state.demoTaps >= DEMO_TAP_LIMIT) {
            set({ isLocked: true, showNodePopup: true });
            return { status: 'LOCKED' };
          }
          set((s) => ({
            demoTaps: s.demoTaps + 1,
            taps: s.taps + 1,
            energy: Math.max(0, s.energy - 1),
            localReward: s.localReward + s.miningRate
          }));
          return { status: 'DEMO', taps: get().taps };
        }
 
        // Optimistic Update
        set((s) => ({
          taps: s.taps + 1,
          energy: Math.max(0, s.energy - 1),
          localReward: s.localReward + s.miningRate
        }));
 
        // Trigger background sync every 10 taps
        if (get().taps % 10 === 0) get().syncWithBackend();
 
        return { status: 'SUCCESS', taps: get().taps };
      },

      rechargeEnergy: () => {
        const state = get();
        // Energy always recharges
        set((s) => ({ energy: Math.min(s.maxEnergy, s.energy + 1) }));

        if (!state.hasNode || state.nodeTier < 1) return;

        const now = Date.now();
        const elapsedSec = (now - state.lastClaimTime) / 1000;
        const cappedSec = Math.min(86400, elapsedSec); // Max 24h
        
        // Rate from user request: 100/hr base, 200/hr Tier 2
        // Extra 100% multiplier (2x) if premium
        const hourlyBase = state.nodeTier >= 2 ? 200 : 100;
        const multiplier = state.isPremium ? 2.0 : 1.0;
        const ratePerHour = hourlyBase * multiplier;
        const ratePerSec = ratePerHour / 3600;
        
        const totalMined = cappedSec * ratePerSec;

        set({ pendingMined: totalMined });
      },

      claimMined: async () => {
        const { walletAddress, pendingMined } = get();
        if (!walletAddress || pendingMined <= 0) return;

        try {
          const res = await api.claimMining(walletAddress);
          if (res.success) {
            set((s) => ({
              localReward: Number(res.user.local_reward),
              pendingMined: 0,
              lastClaimTime: Date.now()
            }));
            return res.reward;
          }
        } catch (err) {
          console.warn("Claim failed:", err.message);
        }
      },

      setActiveTab: (tab) => set({ activeTab: tab }),
      setShowNodePopup: (v) => set({ showNodePopup: v }),
      setShowUpgradePopup: (v) => set({ showUpgradePopup: v }),
      setShowDailyPopup: (v) => set({ showDailyPopup: v }),
      setReferrerId: (id) => set({ referrerId: id }),

      claimStreak: (day) => {
        const rewards = [10000, 25000, 45000, 70000, 100000, 180000, 250000];
        const reward = rewards[Math.min(day - 1, 6)];
        set((s) => ({
          localReward: s.localReward + reward,
          streak: day,
          lastClaimDate: new Date().toDateString(),
          showDailyPopup: false
        }));
        return reward;
      },

      updateChainData: (data) => set({
        pendingReward: data.pendingReward || 0,
        teamSize: data.teamSize || 0,
        directRefs: data.directRefs || 0,
        totalEarned: data.totalEarned || 0,
        poolClaimable: data.poolClaimable || 0
      }),
 
      syncWithBackend: async () => {
        const state = get();
        if (!state.walletAddress) return;
        
        try {
          await api.syncState({
            walletAddress: state.walletAddress,
            taps: state.taps,
            localReward: state.localReward,
            energy: state.energy,
            nodeTier: state.nodeTier
          });
        } catch (err) {
          console.warn("API Sync Failed:", err.message);
        }
      },
 
      fetchUserData: async () => {
        const { walletAddress } = get();
        if (!walletAddress) return;
        
        try {
          const data = await api.fetchUser(walletAddress);
          if (data) {
            set({
              taps: data.taps || 0,
              localReward: Number(data.local_reward || 0),
              energy: data.energy || 0,
              directRefs: data.direct_refs || 0,
              teamSize: data.team_size || 0,
              nodeTier: data.node_tier || 0,
              isPremium: data.is_premium || false,
              pendingMined: Number(data.pending_mined || 0),
              lastClaimTime: new Date(data.last_claim_time).getTime()
            });
          }
        } catch (err) {
          console.warn("API Fetch Failed:", err.message);
        }
      },

      fetchLeaderboardData: async () => {
        try {
          const data = await api.fetchLeaderboard();
          set({ leaderboard: data });
        } catch (err) {
          console.warn("Leaderboard Fetch Failed:", err.message);
        }
      },

      fetchReferralData: async () => {
        const { walletAddress } = get();
        if (!walletAddress) return;
        try {
          const data = await api.fetchReferralList(walletAddress);
          set({ referralList: data });
        } catch (err) {
          console.warn("Referral List Fetch Failed:", err.message);
        }
      },

      // Admin Actions
      fetchAdminStatus: async () => {
        const { walletAddress } = get();
        if (!walletAddress) return;
        try {
          const { blockchain } = await import('../services/blockchain.js');
          const owner = await blockchain.getOwner();
          const isAdmin = walletAddress.toLowerCase() === owner.toLowerCase();
          set({ isAdmin });
          if (isAdmin) {
             get().fetchAdminOverview();
             get().loadSnapshots();
          }
        } catch (e) {
          console.warn("Admin Status Check Failed:", e.message);
        }
      },

      fetchAdminOverview: async () => {
        const { walletAddress, isAdmin } = get();
        if (!isAdmin) return;
        try {
          const stats = await api.fetchAdminOverview(walletAddress);
          set({ adminStats: stats });
        } catch (e) { console.warn(e); }
      },

      takeSnapshot: async (name) => {
        const { walletAddress, isAdmin } = get();
        if (!isAdmin) return;
        try {
          await api.createSnapshot(walletAddress, name);
          get().loadSnapshots();
        } catch (e) { console.warn(e); }
      },

      loadSnapshots: async () => {
        const { walletAddress, isAdmin } = get();
        if (!isAdmin) return;
        try {
          const list = await api.fetchSnapshots(walletAddress);
          set({ snapshotHistory: list });
        } catch (e) { console.warn(e); }
      },
 
      reset: () => set({
        taps: 0, demoTaps: 0, localReward: 0,
        energy: MAX_ENERGY, isLocked: false, showNodePopup: false
      })
    }),
    {
      name: 'aipcore-game-state',
      partialize: (s) => ({
        walletAddress: s.walletAddress,
        isConnected: s.isConnected,
        hasNode: s.hasNode,
        nodeId: s.nodeId,
        nodeTier: s.nodeTier,
        nodeActive: s.nodeActive,
        taps: s.taps,
        demoTaps: s.demoTaps,
        localReward: s.localReward,
        miningRate: s.miningRate,
        maxEnergy: s.maxEnergy,
        streak: s.streak,
        lastClaimDate: s.lastClaimDate,
        referrerId: s.referrerId
      })
    }
  )
);
