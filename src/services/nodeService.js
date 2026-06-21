import { blockchain } from './blockchain.js';
import { useGameStore } from '../store/gameStore.js';

export const loadNodeData = async (address, retries = 2) => {
  if (!address) return;
  try {
    const data = await blockchain.getFullDashboardData(address);
    if (data.hasNode) {
      // ANTI-FLICKER: Only skip setNodeData if DB already has BOTH hasNode AND nodeId.
      const storeState = useGameStore.getState();
      const dbFullyLoaded = storeState.hasNode && storeState.nodeId && Number(storeState.nodeId) > 0;
      if (!dbFullyLoaded) {
        useGameStore.getState().setNodeData({ nodeId: data.nodeId, tier: data.tier, active: data.nodeActive });
      }

      // Always update chain-specific data
      useGameStore.getState().updateChainData({
        totalEarned:      parseFloat(data.totalEarned    || 0),
        teamSize:         data.teamSize,
        directRefs:       data.directRefs,
        pendingReward:    parseFloat(data.pendingReward  || 0),
        poolClaimable:    parseFloat(data.poolClaimable  || 0),
        poolName:         data.poolName        || 'None',
        totalDeposited:   parseFloat(data.totalDeposited || 0),
        isPoolQualified:  Boolean(data.isPoolQualified),
        totalPoolEarned:  parseFloat(data.totalPoolEarned  || 0),
        totalPoolClaimed: parseFloat(data.totalPoolClaimed || 0),
        remainingCap:     parseFloat(data.remainingCap    || 0),
        lifetimeCap:      parseFloat(data.lifetimeCap     || 0),
        missingDirects:   data.missingDirects  || 0,
        missingTier:      data.missingTier     || 0,
        missingTeam:      data.missingTeam     || 0,
      });
      return data.nodeId;
    } else {
      // STABILITY: Never downgrade if DB already shows the user has a node.
      const currentTier = useGameStore.getState().nodeTier || 0;
      if (currentTier === 0) {
        useGameStore.getState().setNodeData({ nodeId: 0, tier: 0, active: false });
      }
      return 0;
    }
  } catch (err) {
    console.error("loadNodeData failed:", err);
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1000));
      return loadNodeData(address, retries - 1);
    }
  }
};

export const fetchBnbBalance = async (address) => {
  if (!address) return;
  try {
    const bal = await blockchain.getBnbBalance(address);
    useGameStore.getState().setBnbBalance(parseFloat(bal).toFixed(4));
    return bal;
  } catch (err) {
    console.error("fetchBnbBalance failed:", err);
  }
};
