import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../services/api.js";

const DEMO_TAP_LIMIT = 20;
const MAX_ENERGY = 500;
const ENERGY_REGEN_INTERVAL = 3000; // ms per 1 energy
const BASE_MINING_RATE = 1000;

const RESET_STATE = {
  hasNode: false, nodeId: null, nodeTier: 0, nodeActive: false, isPremium: false,
  isFreeActive: false, createdAt: null, initialLoaded: false, pendingMined: 0,
  lastSyncTime: null, sponsorWallet: null, sponsorNodeId: null, localReward: 0,
  taps: 0, demoTaps: 0, teamSize: 0, directRefs: 0, totalEarned: 0, streak: 0,
  lastClaimDate: null, teamHistory: [], leaderboard: [], isAdmin: false,
  adminStats: null, claimedMilestones: [], activatedRefs: 0
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
        // Tier from blockchain (authoritative) — clamp to min 1 for active nodes
        const rawTier = data.tier !== undefined ? Number(data.tier) : 0;
        const currentTier = get().nodeTier || 0;
        // Never downgrade an already-known tier from the blockchain
        const tier = rawTier > 0 ? rawTier : currentTier > 0 ? currentTier : 1;

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
          // ...
          demoTaps: 0,
        });

        // Instantly inform the server of the authoritative blockchain tier
        if (isActuallyActive) {
          get().syncWithBackend();
        }
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
        // Energy always recharges
        set((s) => ({ energy: Math.min(s.maxEnergy, s.energy + 1) }));
        // Bug #4 fix: do NOT recalculate pendingMined here.
        // The authoritative pendingMined comes from the server via fetchUserData,
        // and the live counter in EarnScreen correctly adds the local delta on top.
        // Overwriting it here causes balance flicker and double-counting.
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
        const rewards = [10000, 25000, 45000, 70000, 100000, 180000, 250000];
        const reward = rewards[Math.min(day - 1, 6)];
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
          });
        } catch (err) {
          console.warn("API Sync Failed:", err.message);
        }
      },

      fetchUserData: async (forcedReferrer = null) => {
        const { walletAddress, referrerId, isSyncing, lastBackendSync } = get();
        if (!walletAddress || isSyncing) return;
        
        const finalReferrer = forcedReferrer || referrerId;

        // Skip sync if we did it in the last 30 seconds (unless initialLoaded is false)
        const now = Date.now();
        if (get().initialLoaded && lastBackendSync && (now - lastBackendSync < 30000)) {
            return;
        }

        // Show syncing portal only for initial load or if explicitly forced
        const showPortal = !get().initialLoaded;
        if (showPortal) set({ isSyncing: true });
        
        try {
          const data = await api.fetchUser(walletAddress, finalReferrer);
          if (data) {
            const currentTier = get().nodeTier || 0;
            const backendTier = Number(data.node_tier || 0);

            const now = Date.now();
            const creationTime = data.created_at ? new Date(data.created_at).getTime() : now;
            const isFreeActive =
              backendTier === 0 &&
              (now - creationTime < 30 * 24 * 60 * 60 * 1000);

            set({
              taps: data.taps || 0,
              localReward: Number(data.local_reward || 0),
              energy: data.energy || 0,
              directRefs: data.direct_refs || 0,
              teamSize: data.team_size || 0,
              hasNode: backendTier > 0 || (data.node_id && data.node_id > 0),
              nodeId: data.node_id || null,
              nodeTier: backendTier > currentTier ? backendTier : currentTier,
              isPremium: data.is_premium || false,
              pendingMined: Number(data.pending_mined || 0),
              lastClaimTime: new Date(data.last_claim_time).getTime(),
              createdAt: data.created_at,
              isFreeActive: isFreeActive,
              sponsorWallet: data.sponsor_wallet || get().sponsorWallet,
              sponsorNodeId: data.sponsor_node_id || get().sponsorNodeId || 36999,
              isNewUser: !!data.is_new,
              streak: data.daily_streak || 0,
              lastClaimDate: data.last_daily_claim ? new Date(data.last_daily_claim).getTime() : null,
              activatedRefs: Number(data.activated_refs || 0),
              claimedMilestones: JSON.parse(data.claimed_milestones || '[]'),
              lastBackendSync: Date.now(),
              lastSyncTime: Date.now(), // Precise anchor for live ticking
              initialLoaded: true,
            });

            // Automatically refresh the referral list to stay synced with counters
            get().fetchReferralData();

            // 🔗 Belt-and-suspenders: if this is a new user who came via referral link,
            // explicitly call /api/referrals/track to guarantee the DB link is stored.
            if (data.is_new && finalReferrer) {
              api.trackReferral(walletAddress, finalReferrer).then(result => {
                if (result?.linked) {
                  console.log(`✅ Referral confirmed: ${walletAddress} → ${result.sponsor_wallet}`);
                }
              }).catch(() => {});
            }
          }
        } catch (err) {
          console.warn("API Fetch Failed:", err.message);
        } finally {
          set({ isSyncing: false, initialLoaded: true });
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
            localReward: Number(res.local_reward || 0),
            streak: Number(res.daily_streak || 0),
            lastClaimDate: new Date(res.last_daily_claim).getTime(),
          });
          return res;
        }
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
