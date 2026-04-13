/**
 * AIPCore API Service
 * Handles data synchronization with the PostgreSQL backend
 */
class ApiService {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  async fetchUser(walletAddress, referrerId = null) {
    const url = referrerId 
      ? `${this.baseUrl}/user/${walletAddress}?ref=${referrerId}` 
      : `${this.baseUrl}/user/${walletAddress}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  }

  async syncState(data) {
    const res = await fetch(`${this.baseUrl}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Sync failed');
    return res.json();
  }

  async fetchLeaderboard() {
    const res = await fetch(`${this.baseUrl}/leaderboard`);
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    return res.json();
  }

  async fetchReferralList(walletAddress) {
    const res = await fetch(`${this.baseUrl}/referrals/${walletAddress}`);
    if (!res.ok) throw new Error('Failed to fetch referrals');
    return res.json();
  }

  async claimMining(walletAddress) {
    const res = await fetch(`${this.baseUrl}/mining/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress })
    });
    if (!res.ok) throw new Error('Claim failed');
    return res.json();
  }

  async claimDailyReward(walletAddress) {
    const res = await fetch(`${this.baseUrl}/daily/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress })
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Daily claim failed');
    }
    return res.json();
  }

  async upgradeTier(walletAddress, { tier, isPremium }) {
    const res = await fetch(`${this.baseUrl}/mining/upgrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, tier, isPremium })
    });
    if (!res.ok) throw new Error('Upgrade failed');
    return res.json();
  }

  async fetchUserConversions(walletAddress) {
    const res = await fetch(`${this.baseUrl}/user/conversions/${walletAddress}`);
    if (!res.ok) throw new Error('History fetch failed');
    return res.json();
  }

  async fetchIncomeHistory(walletAddress) {
    const res = await fetch(`${this.baseUrl}/user/income-history/${walletAddress}`);
    if (!res.ok) throw new Error('Income history fetch failed');
    return res.json();
  }

  async fetchGlobalHistory() {
    const res = await fetch(`${this.baseUrl}/history/global`);
    if (!res.ok) throw new Error('Global history fetch failed');
    return res.json();
  }

  // Task Endpoints
  async fetchTasks(walletAddress) {
    const res = await fetch(`${this.baseUrl}/tasks/${walletAddress}`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  }

  async claimTask(walletAddress, taskId) {
    const res = await fetch(`${this.baseUrl}/tasks/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, taskId })
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Task claim failed');
    }
    return res.json();
  }

  async claimMilestone(walletAddress, milestoneThreshold) {
    const res = await fetch(`${this.baseUrl}/milestones/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, milestoneThreshold })
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Milestone claim failed');
    }
    return res.json();
  }

  // Admin Endpoints
  async fetchAdminOverview(adminWallet) {
    const res = await fetch(`${this.baseUrl}/admin/overview`, {
      headers: { 'x-admin-wallet': adminWallet }
    });
    if (!res.ok) throw new Error('Access denied');
    return res.json();
  }

  async createSnapshot(adminWallet, name) {
    const res = await fetch(`${this.baseUrl}/admin/snapshot`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-wallet': adminWallet 
      },
      body: JSON.stringify({ name })
    });
    return res.json();
  }

  async fetchSnapshots(adminWallet) {
    const res = await fetch(`${this.baseUrl}/admin/snapshots`, {
      headers: { 'x-admin-wallet': adminWallet }
    });
    return res.json();
  }

  async fetchSnapshotData(adminWallet, id) {
    const res = await fetch(`${this.baseUrl}/admin/snapshot/${id}`, {
      headers: { 'x-admin-wallet': adminWallet }
    });
    return res.json();
  }

  async fetchNetworkLevelMembers(walletAddress, level) {
    const res = await fetch(`${this.baseUrl}/network/level/${walletAddress}/${level}`);
    if (!res.ok) throw new Error('Failed to fetch network level members');
    return res.json();
  }

  async fetchNetworkCounts(walletAddress) {
    const res = await fetch(`${this.baseUrl}/network/counts/${walletAddress}`);
    if (!res.ok) throw new Error('Failed to fetch network counts');
    return res.json();
  }

  async createAdminTask(adminWallet, payload) {
    const res = await fetch(`${this.baseUrl}/admin/tasks`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-wallet': adminWallet 
      },
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  async deleteAdminTask(adminWallet, taskId) {
    const res = await fetch(`${this.baseUrl}/admin/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { 'x-admin-wallet': adminWallet }
    });
    return res.json();
  }

  async fetchAdminUserDetails(adminWallet, userWallet) {
    const res = await fetch(`${this.baseUrl}/admin/user/${userWallet}`, {
      headers: { 'x-admin-wallet': adminWallet }
    });
    if (!res.ok) throw new Error('User not found');
    return res.json();
  }

  async adjustUserReward(adminWallet, userWallet, amount, reason = '') {
    const res = await fetch(`${this.baseUrl}/admin/user/adjust-reward`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-wallet': adminWallet 
      },
      body: JSON.stringify({ walletAddress: userWallet, amount, reason })
    });
    if (!res.ok) throw new Error('Adjustment failed');
    return res.json();
  }

  async fetchAdminAdjustmentHistory(adminWallet) {
    const res = await fetch(`${this.baseUrl}/admin/adjustments`, {
      headers: { 'x-admin-wallet': adminWallet }
    });
    return res.json();
  }

  async fetchGlobalStats() {
    const res = await fetch(`${this.baseUrl}/stats/global`);
    return res.json();
  }

  async initAdminTasksDB(adminWallet) {
    const res = await fetch(`${this.baseUrl}/admin/init-tasks-db`, {
      method: 'POST',
      headers: { 'x-admin-wallet': adminWallet }
    });
    return res.json();
  }

  async fetchNetworkCounts(walletAddress) {
    const res = await fetch(`${this.baseUrl}/network/counts/${walletAddress}`);
    if (!res.ok) throw new Error('Failed to fetch network counts');
    return res.json();
  }

  async fetchNetworkLevelMembers(walletAddress, level) {
    const res = await fetch(`${this.baseUrl}/network/level/${walletAddress}/${level}`);
    if (!res.ok) throw new Error('Failed to fetch level members');
    return res.json();
  }

  async fetchReferrals(walletAddress) {
    const res = await fetch(`${this.baseUrl}/referrals/${walletAddress}`);
    if (!res.ok) throw new Error('Failed to fetch referrals');
    return res.json();
  }

  async syncNetworkMembers(members, parentNodeId) {
    try {
      const response = await fetch(`${this.baseUrl}/network/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members, parentNodeId })
      });
      return await response.json();
    } catch (err) {
      console.error('Sync failed:', err);
      return null;
    }
  }
}

export const api = new ApiService();
