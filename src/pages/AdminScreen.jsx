import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { formatNumber } from '../utils/format.js';
import { api } from '../services/api.js';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

function TaskManagementAdmin() {
  const { walletAddress } = useGameStore();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newTask, setNewTask] = useState({ name: '', reward: '', icon: '💎', url: '', type: 'social' });

  useEffect(() => {
    if (walletAddress) loadTasks();
  }, [walletAddress]);

  const loadTasks = async () => {
    try {
      const data = await api.fetchTasks(walletAddress);
      setTasks(data);
    } catch (e) {
      console.warn('Failed to load tasks for admin');
    }
  };

  const handleCreate = async () => {
    if (!newTask.name || !newTask.reward) return toast.error('Name & Reward required');
    setLoading(true);
    try {
      await api.createAdminTask(walletAddress, {
        ...newTask,
        reward: Number(newTask.reward)
      });
      toast.success('Task created successfully');
      setNewTask({ name: '', reward: '', icon: '💎', url: '', type: 'social' });
      loadTasks();
    } catch (e) {
      toast.error('Failed to create task');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteAdminTask(walletAddress, id);
      toast.success('Task deleted');
      loadTasks();
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  return (
    <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '32px', marginBottom: '32px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '20px', letterSpacing: '0.5px' }}>GLOBAL TASK MANAGEMENT</h3>
      
      {/* Create Task Form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <input placeholder="Task Name (e.g. Follow Twitter)" value={newTask.name} onChange={e => setNewTask({...newTask, name: e.target.value})} style={inputStyle} />
        <input placeholder="Reward Amount (e.g. 50000)" type="number" value={newTask.reward} onChange={e => setNewTask({...newTask, reward: e.target.value})} style={inputStyle} />
        <input placeholder="URL Link (Optional)" value={newTask.url} onChange={e => setNewTask({...newTask, url: e.target.value})} style={inputStyle} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <input placeholder="Icon (💎)" value={newTask.icon} onChange={e => setNewTask({...newTask, icon: e.target.value})} style={{...inputStyle, flex: 0.3}} />
          <select value={newTask.type} onChange={e => setNewTask({...newTask, type: e.target.value})} style={{...inputStyle, flex: 0.7}}>
            <option value="social">Social Link</option>
            <option value="node">Node Required</option>
            <option value="referral">Referral Requirement</option>
          </select>
        </div>
      </div>
      
      <button 
        onClick={handleCreate} disabled={loading}
        style={{ background: '#fff', color: '#000', fontWeight: 900, padding: '12px 20px', borderRadius: '12px', fontSize: '12px', width: '100%', marginBottom: '24px' }}>
        {loading ? '...' : '+ LAUNCH NEW GLOBAL TASK'}
      </button>

      {/* Active Tasks List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h4 style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 800 }}>LIVE SYSTEM TASKS ({Array.isArray(tasks) ? tasks.length : 0})</h4>
        {Array.isArray(tasks) && tasks.map(t => (
          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '18px' }}>{t.icon}</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', fontWeight: 800 }}>{t.name}</span>
                <span style={{ fontSize: '10px', color: 'var(--neon-lime)' }}>
                  +{formatNumber(t.reward)} | {(t.type || 'social').toUpperCase()}
                </span>
              </div>
            </div>
            <button onClick={() => handleDelete(t.id)} style={{ background: 'rgba(255,0,0,0.2)', color: '#ff4444', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: 900, cursor: 'pointer' }}>
              DELETE
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle = { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '12px' };

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

      {/* Database Init Patch */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button 
          onClick={async () => {
            setIsLoading(true);
            try {
              const res = await api.initAdminTasksDB(walletAddress);
              toast.success(res.message);
            } catch (err) {
              toast.error('Init failed');
            }
            setIsLoading(false);
          }}
          disabled={isLoading}
          style={{ background: 'rgba(255,100,100,0.2)', color: '#ff6262', border: '1px solid #ff6262', padding: '8px 16px', borderRadius: '8px', fontSize: '10px', fontWeight: 900 }}
        >
          {isLoading ? '...' : 'INITIALIZE TASKS DB TABLES (RUN ONCE)'}
        </button>
      </div>

      {/* Task Creation & Management Controller */}
      <TaskManagementAdmin />

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
        {(snapshotHistory || []).map(snap => (
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
