import { useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { formatNumber } from '../utils/format.js';
import toast from 'react-hot-toast';

const TASKS = [
  { id: 'tg_join',   icon: '✈️', name: 'Join AIPCore Telegram', reward: 200000, type: 'social', url: 'https://t.me/AIPCoreOfficial' },
  { id: 'tg_chat',   icon: '💬', name: 'Join AIPCore Chat',     reward: 150000, type: 'social', url: 'https://t.me/AIPCoreChat' },
  { id: 'x_follow',  icon: '𝕏',  name: 'Follow on X/Twitter',  reward: 100000, type: 'social',   url: 'https://x.com/AIPCore' },
  { id: 'invite1',   icon: '👤', name: 'Invite 1 Friend',       reward: 500000, type: 'referral' },
  { id: 'invite3',   icon: '👥', name: 'Invite 3 Friends',      reward: 1500000, type: 'referral' },
  { id: 'node_act',  icon: '⬡',  name: 'Activate Node',         reward: 1000000, type: 'node' },
];

export default function TaskScreen() {
  const { taps, hasNode, directRefs, addLocalReward, setActiveTab } = useGameStore();
  const [claimed, setClaimed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aip-tasks') || '[]'); }
    catch { return []; }
  });

  const isComplete = (task) => {
    if (task.type === 'node') return hasNode;
    if (task.id === 'invite1') return directRefs >= 1;
    if (task.id === 'invite3') return directRefs >= 3;
    return claimed.includes(task.id);
  };

  const handleClaim = (task) => {
    if (claimed.includes(task.id)) return;
    if (task.url) window.open(task.url, '_blank');

    const updated = [...claimed, task.id];
    setClaimed(updated);
    localStorage.setItem('aip-tasks', JSON.stringify(updated));
    
    addLocalReward(task.reward);
    toast.success(`+${formatNumber(task.reward)} COINS EARNED! 🔥`);
  };

  return (
    <div className="page page-tasks">
      <div style={{ padding: '10px 0 20px', display: 'flex', alignItems: 'center' }}>
        <button 
          onClick={() => setActiveTab('earn')}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}
        >←</button>
        <h2 style={{ flex: 1, textAlign: 'center', fontSize: '20px', fontWeight: 900 }}>EARN COINS</h2>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: '48px', marginBottom: 8 }}>💎</div>
        <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 700 }}>COMPLETE TASKS & UNLOCK REWARDS</p>
      </div>

      <h3 style={{ fontSize: '14px', fontWeight: 800, margin: '24px 0 16px', color: 'var(--text-dim)' }}>TASK LIST</h3>

      <div className="flex-column" style={{ gap: 12, paddingBottom: 60 }}>
        {TASKS.map(task => {
          const done = isComplete(task);
          return (
            <div key={task.id} className="partner-card" style={{ gap: 16, padding: 16 }}>
              <div style={{ 
                width: '44px', height: '44px', 
                background: 'rgba(255,255,255,0.05)', 
                borderRadius: '10px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px'
              }}>
                {task.icon}
              </div>
              <div className="flex-column" style={{ flex: 1 }}>
                <span style={{ fontSize: '13px', fontWeight: 800 }}>{task.name}</span>
                <span style={{ fontSize: '11px', color: 'var(--neon-lime)', fontWeight: 700 }}>+{formatNumber(task.reward)}</span>
              </div>
              {done ? (
                <span style={{ color: 'var(--neon-lime)', fontWeight: 900, fontSize: '18px' }}>✓</span>
              ) : (
                <button 
                  onClick={() => handleClaim(task)}
                  style={{ 
                    background: 'var(--neon-lime)', color: '#000', border: 'none',
                    padding: '6px 14px', borderRadius: '40px', fontSize: '11px', fontWeight: 900,
                    cursor: 'pointer'
                  }}
                >
                  {task.type === 'social' ? 'JOIN' : 'CLAIM'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
