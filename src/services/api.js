/**
 * AIPCore API Service
 * Handles data synchronization with the PostgreSQL backend
 */
class ApiService {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  async fetchUser(tgId) {
    const res = await fetch(`${this.baseUrl}/user/${tgId}`);
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
}

export const api = new ApiService();
