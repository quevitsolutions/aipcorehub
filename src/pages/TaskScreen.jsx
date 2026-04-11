import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { formatNumber } from '../utils/format.js';
import toast from 'react-hot-toast';

export default function TaskScreen() {
  const { tasks, claimTaskAction, setActiveTab, fetchTasksData } = useGameStore();
  const [claimingId, setClaimingId] = useState(null);

  // Refresh tasks whenever the screen is opened
  useEffect(() => {
    fetchTasksData();
  }, [fetchTasksData]);

  const handleClaim = async (task) => {
    if (task.is_completed || claimingId) return;
    
    if (task.url) {
      window.open(task.url, '_blank');
      // Adding a small mandatory delay to simulate they actually checked the link
      setClaimingId(task.id);
      toast('Verifying task...', { icon: '⏳', duration: 2000 });
      setTimeout(async () => {
        try {
          await claimTaskAction(task.id);
          toast.success(`+${formatNumber(task.reward)} COINS EARNED! 🔥`);
        } catch (err) {
          toast.error(err.message || 'Task claim failed');
        } finally {
          setClaimingId(null);
        }
      }, 2000);
      return;
    }

    setClaimingId(task.id);
    try {
      await claimTaskAction(task.id);
      toast.success(`+${formatNumber(task.reward)} COINS EARNED! 🔥`);
    } catch (err) {
      toast.error(err.message || 'Task claim failed');
    } finally {
      setClaimingId(null);
    }
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

      <h3 style={{ fontSize: '14px', fontWeight: 800, margin: '24px 0 16px', color: 'var(--text-dim)' }}>GLOBAL TASKS</h3>

      <div className="flex-column" style={{ gap: 12, paddingBottom: 60 }}>
        {!Array.isArray(tasks) || tasks.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, padding: '20px' }}>
            No active tasks available right now.
          </div>
        ) : (
          tasks.map(task => {
            const done = task.is_completed;
            const isClaiming = claimingId === task.id;

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
                    disabled={isClaiming}
                    style={{ 
                      background: isClaiming ? 'var(--text-dim)' : 'var(--neon-lime)', 
                      color: '#000', border: 'none',
                      padding: '6px 14px', borderRadius: '40px', fontSize: '11px', fontWeight: 900,
                      cursor: isClaiming ? 'wait' : 'pointer'
                    }}
                  >
                    {isClaiming ? 'WAIT' : (task.type === 'social' ? 'JOIN' : 'CLAIM')}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
