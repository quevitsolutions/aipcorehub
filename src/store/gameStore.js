import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../services/api.js";

const DEMO_TAP_LIMIT = 20;
const MAX_ENERGY = 500;
const ENERGY_REGEN_INTERVAL = 3000; // ms per 1 energy
const BASE_MINING_RATE = 10;

const RESET_STATE = {
  hasNode: false, nodeId: null, nodeTier: 0, nodeActive: false, isPremium: false,
  isFreeActive: false, createdAt: null, initialLoaded: false, pendingMined: 0,
  lastSyncTime: null, sponsorWallet: null, sponsorNodeId: null, localReward: 0,
  taps: 0, demoTaps: 0, teamSize: 0, directRefs: 0, totalEarned: 0, streak: 0,
  lastClaimDate: null, teamHistory: [], leaderboard: [], isAdmin: false,
  adminStats: null, claimedMilestones: [], activatedRefs: 0,
  isFetchingUser: false, isSyncing: false, lastBackendSync: null
};

export const useGameStore = create(
  persist(
    (set, get) => ({
      // Wallet
      walletAddress: null,
      isConnected: false,
      bnbBalance: "0.00",
      isAdmin: false,
      leaderboard: [],
      referralList: [],
      conversionHistory: [],
      adminStats: null,
      snapshotHistory: [],
      adjustmentLogs: [],
      globalStats: { total_users: 0, total_volume_bnb: 0, active_nodes: 0 },
      teamHistory: [],
      globalHistory: [],
      isHistoryLoading: false,
      sponsorWallet: null,   // wallet address of who referred this user
      isNewUser: false,      // true only on very first connect (for welcome banner)

      // Backend Sync
      isSyncing: false,
      isFetchingUser: false,
      isProcessing: false,
      processingLabel: "",
      initialLoaded: false,
      lastBackendSync: null,
      loadingReferrals: false,

      // Node
      hasNode: false,
      nodeId: null,
      nodeTier: 0,
      isPremium: false,
      nodeActive: false,
      isFreeActive: false,
      createdAt: null,

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
      activatedRefs: 0,
      claimedMilestones: [],

      // Streak
      streak: 0,
      lastClaimDate: null,
      showDailyPopup: false,

      // Mining Logic
      lastClaimTime: Date.now(),
      pendingMined: 0,

      // Tasks
      tasks: [],

      // Pool Qualification
      poolQual: {
        poolName: "None",
        isQualified: false,
        nextPoolId: 0,
        totalDeposited: 0,
        missingDirects: 0,
        missingTier: 0,
        missingTeam: 0,
        totalEarned: 0,
        remainingCap: 0,
      },

      // UI
      activeTab: "earn",
      showUpgradePopup: false,

      // Referral
      referrerId: null,
      referralCode: null,

      // Actions
      setWallet: (address) => {
        const current = get().walletAddress;
        // If connecting a different wallet while one is already in state, wipe the slate clean
        const isSwitching = address && current && address.toLowerCase() !== current.toLowerCase();

        set({
          walletAddress: address,
          isConnected: !!address,
          ...(address ? (isSwitching ? RESET_STATE : {}) : RESET_STATE),
        });
      },

      setBnbBalance: (balance) => set({ bnbBalance: balance }),

      disconnectWallet: () => {
        set({
          walletAddress: null,
          isConnected: false,
          bnbBalance: "0.00",
          ...RESET_STATE
        });
        localStorage.removeItem("aipcore-game-state");
      },

      setProcessing: (isProcessing, processingLabel = "") =>
        set({ isProcessing, processingLabel }),

      setNodeData: (data) => {
        const rawTier = data.tier !== undefined ? Number(data.tier) : 0;
        const currentTier = get().nodeTier || 0;
        const tier = rawTier > 0 ? rawTier : currentTier > 0 ? currentTier : 1;

        // 10x MULTIPLIER: If node is active, rate jumps from 10 -> 100
        const isActive = data.nodeId && Number(data.nodeId) > 0;
        const multiplier = isActive ? 10 : 1;
        const newMiningRate = (BASE_MINING_RATE * multiplier) * Math.pow(2, Math.max(0, tier - 1));
        
        const newMaxEnergy  = 500 + (tier - 1) * 200;

        set({
          hasNode:    isActive,
          nodeId:     isActive ? Number(data.nodeId) : null,
          nodeTier:   isActive ? tier : 0,
          nodeActive: data.active,
          miningRate: newMiningRate,
          maxEnergy:  newMaxEnergy,
          energy:     Math.min(newMaxEnergy, get().energy),
          isLocked:   !isActive,
          demoTaps:   0,
        });
      },

      handleTap: () => {
        const state = get();
        if (state.energy <= 0) return { status: "NO_ENERGY" };

        if (!state.hasNode && !state.isFreeActive) {
          if (state.demoTaps >= DEMO_TAP_LIMIT) {
            set({ isLocked: true, showNodePopup: true });
            return { status: "LOCKED" };
          }
          set((s) => ({
            demoTaps: s.demoTaps + 1,
            taps: s.taps + 1,
            energy: Math.max(0, s.energy - 1),
            localReward: s.localReward + s.miningRate,
          }));
          return { status: "DEMO", taps: get().taps };
        }

        // Optimistic Update
        set((s) => ({
          taps: s.taps + 1,
          energy: Math.max(0, s.energy - 1),
          localReward: s.localReward + s.miningRate,
        }));

        // Trigger background sync every 10 taps
        if (get().taps % 10 === 0) get().syncWithBackend();

        return { status: "SUCCESS", taps: get().taps };
      },

      rechargeEnergy: () => {
        const state = get();
        // Elite Sync: Node owners recharge 3x faster (3 per tick vs 1)
        const amount = state.hasNode ? 3 : 1;
        set((s) => ({ energy: Math.min(s.maxEnergy, s.energy + amount) }));
        
        // Anti-flicker: authoritative balance remains on server
      },

      claimMined: async () => {
        const { walletAddress, pendingMined: previousPending } = get();
        if (!walletAddress) return false;

        // Optimistically clear the display — but remember the old value to restore on failure
        set({ pendingMined: 0 });

        try {
          const res = await api.claimMining(walletAddress);
          if (res?.success && res?.user) {
            set({
              localReward: Number(res.user.local_reward || 0),
              lastClaimTime: new Date(res.user.last_claim_time).getTime(),
              lastSyncTime: Date.now(), // Refresh sync anchor to reset live counter
              pendingMined: 0,         // Confirmed: keep at 0
            });
            return true; // Signal success
          }
          // API returned but success=false — restore pending
          set({ pendingMined: previousPending });
          return false;
        } catch (err) {
          // Network/server error — restore pending so user doesn't lose their display
          set({ pendingMined: previousPending });
          console.warn("Claim API failed:", err.message);
          return false;
        }
      },

      setActiveTab: (tab) => set({ activeTab: tab }),
      setShowNodePopup: (v) => set({ showNodePopup: v }),
      setShowUpgradePopup: (v) => set({ showUpgradePopup: v }),
      setShowDailyPopup: (v) => set({ showDailyPopup: v }),
      setReferrerId: (id) => set({ referrerId: id }),

      claimStreak: (day) => {
        const { hasNode } = get();
        // Harmonized Economy: Base rewards match the ~10/hr pace.
        const baseRewards = [100, 250, 450, 700, 1000, 1800, 2500];
        
        // 10x Multiplier: Elite Nodes receive 10x the daily reward.
        const multiplier = hasNode ? 10 : 1;
        const reward = baseRewards[Math.min(day - 1, 6)] * multiplier;
        
        set((s) => ({
          localReward: s.localReward + reward,
          streak: day,
          lastClaimDate: new Date().toDateString(),
          showDailyPopup: false,
        }));
        return reward;
      },

      updateChainData: (data) =>
        set((s) => ({
          pendingReward: data.pendingReward ?? s.pendingReward,
          teamSize: data.teamSize ?? s.teamSize,
          directRefs: data.directRefs ?? s.directRefs,
          totalEarned: data.totalEarned ?? s.totalEarned,
          poolClaimable: data.poolClaimable ?? s.poolClaimable,
          poolQual: {
            ...s.poolQual,
            poolName: data.poolName ?? s.poolQual.poolName,
            totalDeposited: data.totalDeposited ?? s.poolQual.totalDeposited,
            missingDirects: data.missingDirects ?? s.poolQual.missingDirects,
            missingTier: data.missingTier ?? s.poolQual.missingTier,
            missingTeam: data.missingTeam ?? s.poolQual.missingTeam,
          },
        })),

      syncWithBackend: async () => {
        const state = get();
        if (!state.walletAddress) return;

        try {
          await api.syncState({
            walletAddress: state.walletAddress,
            taps: state.taps,
            energy: state.energy,
            nodeTier: state.nodeTier,
            localReward: state.localReward,
          });
        } catch (err) {
          console.warn("API Sync Failed:", err.message);
        }
      },

      fetchUserData: async (forcedReferrer = null) => {
        const { walletAddress, referrerId, lastBackendSync } = get();
        if (!walletAddress) return;

        // BUG FIX: Use a SEPARATE flag so referral fetches aren't blocked by user fetch
        if (get().isFetchingUser) return;

        const finalReferrer = forcedReferrer || referrerId;

        // Skip if synced in the last 30 seconds
        const now = Date.now();
        if (get().initialLoaded && lastBackendSync && (now - lastBackendSync < 30000)) return;

        set({ isFetchingUser: true, isSyncing: !get().initialLoaded });

        try {
          const data = await api.fetchUser(walletAddress, finalReferrer);
          if (!data) return;

          const currentTier = get().nodeTier || 0;
          const backendTier = Number(data.node_tier || 0);
          const creationTime = data.created_at ? new Date(data.created_at).getTime() : now;
          const isFreeActive = backendTier === 0 && (now - creationTime < 30 * 24 * 60 * 60 * 1000);

          const currentNodeId = get().nodeId;
          const currentHasNode = get().hasNode;

          // BUG FIX: safe JSON parse for claimed_milestones
          let claimedMilestones = [];
          try { claimedMilestones = JSON.parse(data.claimed_milestones || '[]'); }
          catch (e) { claimedMilestones = []; }
          if (!Array.isArray(claimedMilestones)) claimedMilestones = [];

          set({
            taps: data.taps || 0,
            // BUG FIX: parseFloat for NUMERIC(36,18) — Number() loses precision on large values
            localReward: parseFloat(data.local_reward || 0),
            energy: data.energy || 0,
            directRefs: parseInt(data.direct_refs || 0),
            teamSize: parseInt(data.team_size || 0),
            activatedRefs: parseInt(data.activated_refs || 0),
            // STABILITY FIX: Never let 30s fetch downgrade node identity if DB is out of sync
            hasNode: backendTier > 0 || !!(data.node_id && data.node_id > 0) || currentHasNode,
            nodeId: data.node_id || currentNodeId,
            nodeTier: backendTier > currentTier ? backendTier : currentTier,
            isPremium: data.is_premium || false,
            pendingMined: parseFloat(data.pending_mined || 0),
            // BUG FIX: Guard null last_claim_time — new Date(null) = epoch 1970
            lastClaimTime: data.last_claim_time ? new Date(data.last_claim_time).getTime() : now,
            createdAt: data.created_at || null,
            isFreeActive,
            sponsorWallet: data.sponsor_wallet || get().sponsorWallet,
            sponsorNodeId: data.sponsor_node_id || get().sponsorNodeId || 36999,
            isNewUser: !!data.is_new,
            streak: parseInt(data.daily_streak || 0),
            // BUG FIX: Guard null last_daily_claim
            lastClaimDate: data.last_daily_claim ? new Date(data.last_daily_claim).getTime() : null,
            claimedMilestones,
            lastBackendSync: Date.now(),
            lastSyncTime: Date.now(),
            initialLoaded: true,
          });

          // PERF FIX: Removed fetchReferralData() from here — it was firing every 30s
          // causing double API calls. Referral list is now fetched on-demand (tab switch).

          // Belt-and-suspenders: guarantee DB referral link for new users
          if (data.is_new && finalReferrer) {
            api.trackReferral(walletAddress, finalReferrer).then(result => {
              if (result?.linked) {
                console.log(`✅ Referral confirmed: ${walletAddress} → ${result.sponsor_wallet}`);
              }
            }).catch(() => { });
          }
        } catch (err) {
          console.warn('fetchUserData failed:', err.message);
        } finally {
          set({ isFetchingUser: false, isSyncing: false, initialLoaded: true });
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
        set({ loadingReferrals: true });
        try {
          const data = await api.fetchReferralList(walletAddress);
          set({ referralList: Array.isArray(data) ? data : [] });
        } catch (err) {
          console.warn("Referral List Fetch Failed:", err.message);
        } finally {
          set({ loadingReferrals: false });
        }
      },

      fetchTasksData: async () => {
        const { walletAddress } = get();
        if (!walletAddress) return;
        try {
          const fetchedTasks = await api.fetchTasks(walletAddress);
          set({ tasks: fetchedTasks });
        } catch (err) {
          console.warn("Tasks Fetch Failed:", err.message);
        }
      },

      claimTaskAction: async (taskId) => {
        const { walletAddress, tasks } = get();
        if (!walletAddress) throw new Error("Not connected");

        const res = await api.claimTask(walletAddress, taskId);
        if (res?.success) {
          set({
            localReward: Number(res.new_balance || 0),
            tasks: tasks.map((t) =>
              t.id === taskId ? { ...t, is_completed: true } : t,
            ),
          });
          return res;
        }
      },

      claimMilestoneAction: async (threshold) => {
        const { walletAddress, claimedMilestones } = get();
        if (!walletAddress) throw new Error("Not connected");

        const res = await api.claimMilestone(walletAddress, threshold);
        if (res?.success) {
          set({
            localReward: Number(get().localReward) + Number(res.reward),
            claimedMilestones: res.claimed_milestones || [...claimedMilestones, threshold],
          });
          return res;
        }
      },

      claimFreeMilestoneAction: async (threshold) => {
        const { walletAddress, claimedMilestones } = get();
        if (!walletAddress) throw new Error("Not connected");

        const res = await api.claimFreeMilestone(walletAddress, threshold);
        if (res?.success) {
          set({
            localReward: Number(get().localReward) + Number(res.reward),
            claimedMilestones: res.claimed_milestones || [...claimedMilestones, `free_${threshold}`],
          });
          return res;
        }
      },

      claimSignupBonusAction: async () => {
        const { walletAddress, claimedMilestones } = get();
        if (!walletAddress) throw new Error("Not connected");

        const res = await api.claimSignupBonus(walletAddress);
        if (res?.success) {
          set({
            localReward: Number(res.new_balance || (Number(get().localReward) + Number(res.reward))),
            claimedMilestones: res.claimed_milestones || [...claimedMilestones, 'signup_bonus'],
          });
          return res;
        }
      },

      claimDailyReward: async () => {
        const { walletAddress } = get();
        if (!walletAddress) throw new Error("Wallet not connected");

        const res = await api.claimDailyReward(walletAddress);
        if (res?.success) {
          set({
            // BUG FIX: parseFloat because Postgres NUMERIC returns a string
            localReward: parseFloat(res.local_reward || 0),
            streak: Number(res.daily_streak || 0),
            // Store as millisecond timestamp for accurate 24h comparison
            lastClaimDate: res.last_daily_claim ? new Date(res.last_daily_claim).getTime() : Date.now(),
          });
          return res;
        }
        throw new Error('Daily reward claim failed');
      },

      // Admin Actions
      fetchAdminStatus: async () => {
        const { walletAddress } = get();
        if (!walletAddress) return;
        try {
          // Priority 1: Environment Variable
          const envAdmin = import.meta.env.VITE_ADMIN_WALLET || "";
          let isAdmin = walletAddress.toLowerCase() === envAdmin.toLowerCase();

          // Priority 2: Blockchain Owner (Backup in case of build/env issues)
          if (!isAdmin) {
            const { blockchain } = await import("../services/blockchain.js");
            const owner = await blockchain.getOwner();
            if (owner && walletAddress.toLowerCase() === owner.toLowerCase()) {
              isAdmin = true;
            }
          }

          set({ isAdmin });
          if (isAdmin) {
            get().fetchAdminOverview();
            get().loadSnapshots();
            get().fetchAdminAdjustments();
          }
          get().fetchGlobalProtocolStats();
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
        } catch (e) {
          console.warn(e);
        }
      },

      fetchAdminAdjustments: async () => {
        const { walletAddress, isAdmin } = get();
        if (!isAdmin) return;
        try {
          const logs = await api.fetchAdminAdjustmentHistory(walletAddress);
          set({ adjustmentLogs: Array.isArray(logs) ? logs : [] });
        } catch (e) {
          console.warn(e);
        }
      },

      fetchGlobalProtocolStats: async () => {
        try {
          const stats = await api.fetchGlobalStats();
          if (stats) set({ globalStats: stats });
        } catch (e) {
          console.warn("Global Stats Fetch Failed:", e.message);
        }
      },

      takeSnapshot: async (name) => {
        const { walletAddress, isAdmin } = get();
        if (!isAdmin) return;
        try {
          await api.createSnapshot(walletAddress, name);
          get().loadSnapshots();
        } catch (e) {
          console.warn(e);
        }
      },

      loadSnapshots: async () => {
        const { walletAddress, isAdmin } = get();
        if (!isAdmin) return;
        try {
          const list = await api.fetchSnapshots(walletAddress);
          set({ snapshotHistory: Array.isArray(list) ? list : [] });
        } catch (e) {
          console.warn(e);
        }
      },

      fetchUserConversions: async () => {
        const { walletAddress } = get();
        if (!walletAddress) return;
        try {
          const list = await api.fetchUserConversions(walletAddress);
          set({ conversionHistory: list });
        } catch (e) {
          console.warn("Conversion History Fetch Failed:", e.message);
        }
      },

      fetchTeamHistory: async () => {
        const { walletAddress } = get();
        if (!walletAddress) return;
        set({ isHistoryLoading: true });
        try {
          let list = null;

          // Resolve nodeId — use store value OR look up from contract if not yet loaded
          let { nodeId } = get();
          if (!nodeId || nodeId === 0) {
            try {
              const { blockchain } = await import('../services/blockchain.js');
              const data = await blockchain.getFullDashboardData(walletAddress);
              if (data?.hasNode && data.nodeId > 0) {
                nodeId = data.nodeId;
              }
            } catch (_) { /* can't resolve nodeId, will use API fallback */ }
          }

          // Primary: fetch directly from contract storage (no block scan limits, always complete)
          if (nodeId && nodeId > 0) {
            const { blockchain } = await import('../services/blockchain.js');
            list = await blockchain.fetchTeamHistoryOnChain(nodeId, 100);
          }

          // Fallback: postgres (covers pool claims & any event the contract `getIncome` misses)
          if (!list || list.length === 0) {
            list = await api.fetchIncomeHistory(walletAddress);
          }

          set({ teamHistory: Array.isArray(list) ? list : [] });
        } catch (e) {
          console.warn("Team History Fetch Failed:", e.message);
        } finally {
          set({ isHistoryLoading: false });
        }
      },

      fetchGlobalHistory: async () => {
        try {
          const list = await api.fetchGlobalHistory();
          set({ globalHistory: Array.isArray(list) ? list : [] });
        } catch (e) {
          console.warn("Global History Fetch Failed:", e.message);
        }
      },

      reset: () =>
        set({
          taps: 0,
          demoTaps: 0,
          localReward: 0,
          conversionHistory: [],
          energy: MAX_ENERGY,
          isLocked: false,
          showNodePopup: false,
        }),
    }),
    {
      name: "aipcore-game-state",
      version: 2,
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
        referrerId: s.referrerId,
        sponsorWallet: s.sponsorWallet,   // persist so banner shows correctly after refresh
      }),
    },
  ),
);
