// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IAIPCore.sol";

interface IRewardPoolViews {
    function getClaimable(uint nodeId) external view returns (uint fromCurrentPool, uint fromExitedPools, uint total);
    function totalClaimed(uint nodeId) external view returns (uint);
}

library AIPViews {

    function getMatrixUsers(
        mapping(uint => IAIPCore.Node) storage nodes,
        mapping(uint => mapping(uint => uint[])) storage teams,
        uint _nodeId, uint _layer, uint _startIndex, uint _num
    ) external view returns (IAIPCore.Node[] memory) {
        uint length = teams[_nodeId][_layer].length;
        if (length == 0 || _startIndex >= length) return new IAIPCore.Node[](0);
        
        uint resultCount = (length > _num + _startIndex) ? _num : (length - _startIndex);
        IAIPCore.Node[] memory _users = new IAIPCore.Node[](resultCount);
        
        for (uint i = 0; i < resultCount; i++) {
            _users[i] = nodes[teams[_nodeId][_layer][_startIndex + i]];
        }
        return _users;
    }

    function getIncome(
        mapping(uint => IAIPCore.RewardEvent[]) storage rewardHistory,
        uint _nodeId, uint _length
    ) external view returns (IAIPCore.RewardEvent[] memory) {
        uint historyLen = rewardHistory[_nodeId].length;
        if (historyLen == 0) return new IAIPCore.RewardEvent[](0);

        uint returnLen = historyLen > _length ? _length : historyLen;
        IAIPCore.RewardEvent[] memory _income = new IAIPCore.RewardEvent[](returnLen);

        uint index = returnLen - 1;
        for (uint i = historyLen; i > historyLen - returnLen; i--) {
            _income[index] = rewardHistory[_nodeId][i - 1];
            if (index > 0) index--;
        }
        return _income;
    }

    function getMissedIncome(
        mapping(uint => IAIPCore.RewardEvent[]) storage rewardHistory,
        uint _nodeId, uint _length
    ) external view returns (IAIPCore.RewardEvent[] memory) {
        uint historyLen = rewardHistory[_nodeId].length;
        if (historyLen == 0) return new IAIPCore.RewardEvent[](0);

        uint missedCount = 0;
        for (uint i = 0; i < historyLen; i++) {
            if (rewardHistory[_nodeId][i].isMissed) missedCount++;
        }
        
        uint returnLen = missedCount > _length ? _length : missedCount;
        IAIPCore.RewardEvent[] memory _income = new IAIPCore.RewardEvent[](returnLen);
        if (returnLen == 0) return _income;

        uint index = returnLen - 1;
        for (uint i = historyLen; i > 0; i--) {
            if (rewardHistory[_nodeId][i - 1].isMissed) {
                _income[index] = rewardHistory[_nodeId][i - 1];
                if (index == 0) break;
                index--;
            }
        }
        return _income;
    }

    function getIncomeByType(
        mapping(uint => IAIPCore.RewardEvent[]) storage rewardHistory,
        uint _nodeId, uint _type, uint _length
    ) external view returns (IAIPCore.RewardEvent[] memory) {
        uint historyLen = rewardHistory[_nodeId].length;
        if (historyLen == 0) return new IAIPCore.RewardEvent[](0);

        uint typeCount = 0;
        for (uint i = 0; i < historyLen; i++) {
            if (rewardHistory[_nodeId][i].rewardType == _type) typeCount++;
        }
        
        uint returnLen = typeCount > _length ? _length : typeCount;
        IAIPCore.RewardEvent[] memory _income = new IAIPCore.RewardEvent[](returnLen);
        if (returnLen == 0) return _income;

        uint index = returnLen - 1;
        for (uint i = historyLen; i > 0; i--) {
            if (rewardHistory[_nodeId][i - 1].rewardType == _type) {
                _income[index] = rewardHistory[_nodeId][i - 1];
                if (index == 0) break;
                index--;
            }
        }
        return _income;
    }

    // --- DASHBOARD TUPLE HELPERS ---

    function _getPoolIncome(address _rewardPool, uint _userId) private view returns (uint) {
        if (_rewardPool == address(0)) return 0;
        uint poolIncome = 0;
        try IRewardPoolViews(_rewardPool).getClaimable(_userId) returns (uint, uint, uint claimable) {
            try IRewardPoolViews(_rewardPool).totalClaimed(_userId) returns (uint claimed) {
                poolIncome = claimable + claimed;
            } catch {}
        } catch {}
        return poolIncome;
    }

    function getTotalIncome(
        mapping(uint => IAIPCore.RewardInfo) storage rewardInfo,
        address _rewardPool,
        uint _userId
    ) external view returns (uint) {
        uint poolIncome = _getPoolIncome(_rewardPool, _userId);
        return rewardInfo[_userId].totalRewards + poolIncome;
    }

    function getNodeStats(
        mapping(uint => IAIPCore.Node) storage nodes,
        mapping(uint => IAIPCore.RewardInfo) storage rewardInfo,
        address _rewardPool,
        uint _userId
    ) external view returns (
        uint tier, uint directCount, uint matrixCount,
        uint totalRewards, uint totalContribution, uint daysActive
    ) {
        IAIPCore.Node memory node = nodes[_userId];
        require(node.nodeId != 0, "Node not found");
        
        tier = node.tier;
        directCount = node.directNodes;
        matrixCount = node.totalMatrixNodes;
        
        uint poolIncome = _getPoolIncome(_rewardPool, _userId);
        totalRewards = rewardInfo[_userId].totalRewards + poolIncome;
        
        totalContribution = node.totalContribution;
        daysActive = (block.timestamp - node.joinedAt) / 1 days;
    }

    function getIncomeBreakdown(
        mapping(uint => IAIPCore.RewardInfo) storage rewardInfo,
        address _rewardPool,
        uint _userId
    ) external view returns (
        uint total, uint referral, uint tier,
        uint binary, uint direct, uint lost, uint poolIncome
    ) {
        IAIPCore.RewardInfo storage info = rewardInfo[_userId];
        poolIncome = _getPoolIncome(_rewardPool, _userId);
        
        return (
            info.totalRewards + poolIncome, info.sponsorReward, info.layerReward,
            info.matrixReward, info.directReward, info.missedReward, poolIncome
        );
    }

    function getPoolQualificationData(
        mapping(uint => IAIPCore.Node) storage nodes,
        mapping(uint => mapping(uint => uint[])) storage networkTree,
        uint _userId
    ) external view returns (
        uint totalDeposited, uint directReferrals, uint totalTeam,
        uint currentLevel, uint directTeamL1, uint matrixTeam,
        uint registrationTime, bool isActive
    ) {
        IAIPCore.Node memory node = nodes[_userId];
        
        totalDeposited = node.totalContribution;
        directReferrals = node.directNodes;
        totalTeam = networkTree[_userId][0].length;
        currentLevel = node.tier;
        directTeamL1 = node.sponsorTierRanks[0];
        matrixTeam = node.totalMatrixNodes;
        registrationTime = node.joinedAt;
        isActive = (node.nodeId != 0);
    }

    function getNetworkNodes(
        mapping(uint => IAIPCore.Node) storage nodes,
        mapping(uint => mapping(uint => uint[])) storage networkTree,
        uint _nodeId, uint _layer, uint _num
    ) external view returns (IAIPCore.Node[] memory) {
        uint treeLen = networkTree[_nodeId][_layer].length;
        if (treeLen == 0) return new IAIPCore.Node[](0);

        uint returnLen = treeLen > _num ? _num : treeLen;
        IAIPCore.Node[] memory _users = new IAIPCore.Node[](returnLen);

        uint taken = 0;
        for (uint i = treeLen; i > treeLen - returnLen; i--) {
            _users[taken] = nodes[networkTree[_nodeId][_layer][i - 1]];
            taken++;
        }
        return _users;
    }

    function getNetworkNodesWithStats(
        mapping(uint => IAIPCore.Node) storage nodes,
        mapping(uint => IAIPCore.RewardInfo) storage rewardInfo,
        mapping(uint => mapping(uint => uint[])) storage networkTree,
        uint _nodeId, uint _layer, uint _num
    ) external view returns (IAIPCore.NodeWithStats[] memory) {
        uint treeLen = networkTree[_nodeId][_layer].length;
        if (treeLen == 0) return new IAIPCore.NodeWithStats[](0);

        uint returnLen = treeLen > _num ? _num : treeLen;
        IAIPCore.NodeWithStats[] memory _users = new IAIPCore.NodeWithStats[](returnLen);

        for (uint i = 0; i < returnLen; i++) {
            uint targetId = networkTree[_nodeId][_layer][treeLen - 1 - i];
            _users[i] = IAIPCore.NodeWithStats({
                node: nodes[targetId],
                missedReward: rewardInfo[targetId].missedReward
            });
        }
        return _users;
    }

    function getTierCosts(
        uint bnbPrice,
        uint[18] storage tierPriceUSD
    ) external view returns (uint[18] memory _costs) {
        uint safePrice = bnbPrice == 0 ? 1e15 : bnbPrice;
        for (uint i = 0; i < 18; i++) {
            _costs[i] = (tierPriceUSD[i] * 1e8) / safePrice;
        }
        return _costs;
    }
}
