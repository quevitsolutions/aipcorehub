export const AIPCORE_ABI = [
  "function owner() view returns (address)",
  "function createNode(uint256 _sponsor) external payable",
  "function unlockTier(uint256 _nodeId, uint256 _toTier) external payable",
  "function withdraw() external",
  "function pendingReward(address user) view returns (uint256)",
  "function nodeId(address user) view returns (uint256)",
  "function nodes(uint256 nodeId) view returns (address wallet, uint88 nodeId_, uint256 sponsor, uint256 matrixParent, uint40 joinedAt, uint256 tier, uint256 directNodes, uint256 totalMatrixNodes, uint256 totalContribution)",
  "function isNodeActive(uint256 userId) view returns (bool)",
  "function isNodeRegistered(address node) view returns (bool)",
  "function getTierCost(uint256 _index) view returns (uint256)",
  "function getTierCosts() view returns (uint256[18])",
  "function bnbPrice() view returns (uint256)",
  "function getTeamSize(uint256 _userId, uint256 _depth) view returns (uint256)",
  "function getNetworkNodes(uint256 _nodeId, uint256 _layer, uint256 _num) view returns (tuple(address wallet, uint64 nodeId, uint64 sponsor, uint64 matrixParent, uint40 joinedAt, uint8 tier, uint32 directNodes, uint32 totalMatrixNodes, uint256 totalContribution, uint32[18] sponsorTierRanks, uint64[18] matrixRewardReceiver)[])",
  "function getMatrixUsers(uint256 nodeId, uint256 layer, uint256 startIndex, uint256 num) view returns (tuple(address wallet, uint64 nodeId, uint64 sponsor, uint64 matrixParent, uint40 joinedAt, uint8 tier, uint32 directNodes, uint32 totalMatrixNodes, uint256 totalContribution, uint32[18] sponsorTierRanks, uint64[18] matrixRewardReceiver)[])",
  "function getNodeStats(uint256 _userId) view returns (uint256 tier, uint256 directCount, uint256 matrixCount, uint256 totalRewards, uint256 totalContribution, uint256 daysActive)",
  "function getIncomeBreakdown(uint256 _nodeId) view returns (uint256 total, uint256 referral, uint256 tier, uint256 binary, uint256 direct, uint256 lost, uint256 poolIncome)",
  "event NodeCreated(address indexed node, uint256 indexed userId, uint256 indexed referrerId, uint256 uplineId)",
  "event TierUnlocked(address indexed node, uint256 indexed userId, uint256 packageId)"
];

export const AIPVIEW_ABI = [
  "function getNodeStats(uint256 nodeId) view returns (uint256 totalEarned, uint256 teamSize, uint256 directRefs, uint256 level)",
  "function getIncomeBreakdown(uint256 nodeId) view returns (uint256 direct, uint256 matrix, uint256 pool, uint256 pending)"
];

export const REWARDPOOL_ABI = [
  "function registerNode(uint256 nodeId) external",
  "function claim(uint256 nodeId) external",
  "function getClaimable(uint256 nodeId) view returns (uint256 fromCurrentPool, uint256 fromExitedPools, uint256 total)",
  "function getPoolViewHelper(uint256 nodeId) view returns (uint8 currentPoolId, string poolName, uint256 claimable, uint256 totalEarned, uint256 totalClaimedAmount, uint256 remainingCap, uint256 lifetimeCap, uint256 totalDeposited, uint256 nfeTier, bool isQualifiedForNext, uint8 nextPoolId, uint256[3] missingRequirements)",
  "function getCapInfo(uint256 nodeId) view returns (uint256 capMultiplier, uint256 totalDeposited, uint256 lifetimeCap, uint256 claimed, uint256 remaining)",
  "function nodePool(uint256 nodeId) view returns (uint8)",
  "event RewardClaimed(uint256 nodeId, address wallet, uint256 amount)"
];
