/**
 * AIPCore API Service
 * Handles data synchronization with the PostgreSQL backend
 */
class ApiService {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  async fetchUser(walletAddress) {
    const res = await fetch(`${this.baseUrl}/user/${walletAddress}`);
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

  async initAdminTasksDB(adminWallet) {
    const res = await fetch(`${this.baseUrl}/admin/init-tasks-db`, {
      method: 'POST',
      headers: { 'x-admin-wallet': adminWallet }
    });
    return res.json();
  }
}

export const api = new ApiService();
