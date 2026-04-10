import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { formatNumber } from '../utils/format.js';
import { api } from '../services/api.js';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminScreen() {
  const { walletAddress, adminStats, snapshotHistory, takeSnapshot, loadSnapshots } = useGameStore();
  const [snapshotName, setSnapshotName] = useState('');
  const [conversionRate, setConversionRate] = useState(1000);
  const [tokenAddress, setTokenAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSnapshots();
  }, [loadSnapshots]);

  const handleCreateSnapshot = async () => {
    if (!snapshotName) return;
    setIsLoading(true);
    await takeSnapshot(snapshotName);
    setSnapshotName('');
    setIsLoading(false);
  };

  const exportCSV = async (snapshotId, name) => {
    const data = await api.fetchSnapshotData(walletAddress, snapshotId);
    if (!data || !data.data) return;

    // Multi-sender/Bulk format: address,amount
    let csvContent = "address,amount\n";
    data.data.forEach(user => {
      const realAmount = (parseFloat(user.local_reward) / conversionRate).toFixed(4);
      if (parseFloat(realAmount) > 0) {
        csvContent += `${user.wallet_address},${realAmount}\n`;
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `distribute_${name}_rate_${conversionRate}.csv`;
    a.click();
  };

  return (
    <div className="page-content" style={{ padding: '0 20px 40px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--neon-lime)', marginBottom: '24px', letterSpacing: '1px' }}>
        MASTER CONTROL
      </h2>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 800 }}>TOTAL USERS</span>
          <div style={{ fontSize: '24px', fontWeight: 900, marginTop: '4px' }}>{adminStats?.total_users || 0}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 800 }}>MINING VOLUME</span>
          <div style={{ fontSize: '24px', fontWeight: 900, marginTop: '4px', color: 'var(--neon-lime)' }}>
            {formatNumber(adminStats?.total_reward || 0)}
          </div>
        </div>
      </div>

      {/* Snapshot Controller */}
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '32px', marginBottom: '32px', border: '1px solid rgba(203, 255, 1, 0.1)' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '20px', letterSpacing: '0.5px' }}>SNAPSHOT & AIRDROP</h3>
        
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="Snapshot Name (e.g. April Airdrop)"
            value={snapshotName}
            onChange={(e) => setSnapshotName(e.target.value)}
            style={{ 
              flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '12px', padding: '12px 16px', color: '#fff' 
            }}
          />
          <button 
            onClick={handleCreateSnapshot}
            disabled={isLoading || !snapshotName}
            style={{ 
              background: 'var(--neon-lime)', color: '#000', fontWeight: 900, 
              padding: '0 20px', borderRadius: '12px', fontSize: '12px' 
            }}
          >
            {isLoading ? '...' : 'CAPTURE'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>CONVERSION RATE</label>
            <input 
              type="number" 
              value={conversionRate}
              onChange={(e) => setConversionRate(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px', color: '#fff' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>TOKEN ADDRESS</label>
            <input 
              type="text" 
              placeholder="0x..."
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px', color: '#fff' }}
            />
          </div>
        </div>
      </div>

      {/* Snapshot History */}
      <h3 style={{ fontSize: '12px', fontWeight: 900, color: 'var(--text-dim)', marginBottom: '16px', paddingLeft: '8px' }}>SNAPSHOT HISTORY</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {snapshotHistory.map(snap => (
          <div key={snap.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px 20px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '14px' }}>{snap.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                {snap.total_users} Users • {formatNumber(snap.total_coins)} Coins
              </div>
            </div>
            <button 
              onClick={() => exportCSV(snap.id, snap.name)}
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--neon-lime)', border: '1px solid rgba(203,255,1,0.2)', padding: '8px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 900 }}
            >
              CSV EXPORT
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
