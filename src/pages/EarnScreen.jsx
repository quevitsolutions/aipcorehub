import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { formatNumber } from '../utils/format.js';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_TASKS = [
  { id: 'tg_join',  icon: '✈️', label: 'Telegram', reward: 200000, url: 'https://t.me/AIPCoreOfficial', color: '#2AABEE' },
  { id: 'tg_chat',  icon: '💬', label: 'TG Chat',  reward: 150000, url: 'https://t.me/AIPCoreChat',    color: '#2AABEE' },
  { id: 'x_follow', icon: '𝕏',  label: 'X/Twitter', reward: 100000, url: 'https://x.com/AIPCore',       color: '#fff' },
];

export default function EarnScreen() {
  const {
    localReward, nodeTier, isPremium, energy, maxEnergy,
    hasNode, nodeId, lastClaimTime, pendingMined,
    handleTap, claimMined, setActiveTab, addLocalReward
  } = useGameStore();

  const [taps, setTaps] = useState([]);
  const [isExploding, setIsExploding] = useState(false);
  const [, setTick] = useState(0);
  const [claimedTasks, setClaimedTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aip-tasks') || '[]'); } catch { return []; }
  });

  const handleTaskClaim = (task) => {
    if (claimedTasks.includes(task.id)) return;
    window.open(task.url, '_blank');
    const updated = [...claimedTasks, task.id];
    setClaimedTasks(updated);
    localStorage.setItem('aip-tasks', JSON.stringify(updated));
    addLocalReward(task.reward);
  };

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const hourlyBase = nodeTier >= 2 ? 200 : 100;
  const multiplier = isPremium ? 2.0 : 1.0;
  const ratePerHour = hourlyBase * multiplier;
  
  const maturity = hasNode && nodeTier >= 1 ? Math.min(1, pendingMined / ratePerHour) : 0;
  
  const timeElapsed = Date.now() - lastClaimTime;
  const timeRemaining = Math.max(0, 86400000 - timeElapsed);

  const formatTime = (ms) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  const handleTapInteraction = useCallback((e) => {
    const res = handleTap();
    if (res.status === 'SUCCESS' || res.status === 'DEMO') {
      const touch = e.touches ? e.touches[0] : e;
      const x = touch.clientX;
      const y = touch.clientY;
      const id = Date.now();
      
      setTaps(prev => [...prev, { id, x, y, val: (ratePerHour / 3600).toFixed(2) }]);
      setTimeout(() => setTaps(prev => prev.filter(t => t.id !== id)), 800);
    }
  }, [handleTap, ratePerHour]);

  const onClaim = () => {
    if (pendingMined <= 0) return;
    setIsExploding(true);
    setTimeout(() => {
      claimMined();
      setIsExploding(false);
    }, 800);
  };

  return (
    <div className="page-earn" style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      
      {/* Top Header - Unified Stats */}
      <div style={{ flexShrink: 0, padding: '10px 0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {hasNode && nodeTier >= 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: 'var(--neon-lime)', fontSize: '12px', fontWeight: 900, letterSpacing: '1px' }}>
                ⬡ NODE #{nodeId} (TIER {nodeTier})
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 800 }}>RATE: {ratePerHour}/HR</span>
                {isPremium && (
                  <span style={{ fontSize: '9px', background: 'var(--neon-lime)', color: '#000', padding: '1px 4px', borderRadius: '4px', fontWeight: 900 }}>2X BOOST</span>
                )}
              </div>
            </div>
          ) : (
            <span style={{ color: 'var(--text-dim)', fontSize: '11px', fontWeight: 700 }}>STANDBY MODE</span>
          )}
        </div>
        
        {/* Energy bar */}
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--neon-lime)' }}>{energy}</span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>/ {maxEnergy}</span>
          </div>
          <div style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(energy / maxEnergy) * 100}%` }}
              style={{ height: '100%', background: 'var(--neon-lime)', boxShadow: '0 0 10px var(--neon-lime)' }}
            />
          </div>
        </div>
      </div>

      {/* ─ Social Task Quick-Strip ─ */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, overflowX: 'auto', paddingBottom: 2 }}>
        {QUICK_TASKS.map(task => {
          const done = claimedTasks.includes(task.id);
          return (
            <motion.button
              key={task.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTaskClaim(task)}
              disabled={done}
              style={{
                flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 6,
                background: done ? 'rgba(203,255,1,0.07)' : 'rgba(255,255,255,0.04)',
                border: done ? '1px solid rgba(203,255,1,0.3)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 40, padding: '6px 14px',
                cursor: done ? 'default' : 'pointer',
                fontSize: 11, fontWeight: 800, color: done ? 'var(--neon-lime)' : '#fff',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{task.icon}</span>
              <span>{task.label}</span>
              {done
                ? <span style={{ color: 'var(--neon-lime)' }}>✓</span>
                : <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>+{formatNumber(task.reward)}</span>
              }
            </motion.button>
          );
        })}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab('tasks')}
          style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 40, padding: '6px 14px', cursor: 'pointer',
            fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap'
          }}
        >
          MORE TASKS →
        </motion.button>
      </div>

      {/* Main Balance Display */}
      <div className="balance-container" style={{ margin: '10px 0 20px' }}>
        <div className="balance-main">
          <img src="/assets/gold_coin.png" className="balance-coin" style={{ width: 44 }} alt="coin" />
          <span className="balance-value" style={{ fontSize: '48px' }}>{formatNumber(localReward)}</span>
        </div>
      </div>

      {/* Cinematic Interaction Zone */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div className="egg-hub" style={{ position: 'relative' }}>
          
          {/* Circular Maturity Tracer */}
          <svg style={{ position: 'absolute', inset: -20, width: 280, height: 280, transform: 'rotate(-90deg)' }}>
            <circle cx="140" cy="140" r="130" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
            <motion.circle 
              cx="140" cy="140" r="130" 
              fill="none" stroke="var(--neon-lime)" strokeWidth="4" 
              strokeDasharray="816"
              animate={{ strokeDashoffset: 816 * (1 - maturity) }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>

          <AnimatePresence>
            {isExploding && (
              <motion.div 
                initial={{ opacity: 1, scale: 0.8 }}
                animate={{ opacity: 0, scale: 2 }}
                style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, var(--neon-lime) 0%, transparent 70%)', zIndex: 5, borderRadius: '50%' }}
              />
            )}
          </AnimatePresence>

          <motion.div 
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            style={{ position: 'relative', width: '240px', height: '240px', cursor: 'pointer', zIndex: 10 }}
            onClick={handleTapInteraction}
          >
            <img 
              src="/assets/egg_orange.png" 
              className={`egg-main ${maturity >= 1 ? 'egg-glow' : ''}`}
              alt="Mining Egg"
              style={{
                width: '100%', height: '100%',
                objectFit: 'contain',
                filter: `drop-shadow(0 0 ${25 * maturity}px rgba(203, 255, 1, 0.4))`
              }}
            />
          </motion.div>

          {/* Floating Points Overlay */}
          <AnimatePresence>
            {taps.map(t => (
              <motion.span
                key={t.id}
                initial={{ opacity: 1, y: t.y - 120, x: t.x - 120 }}
                animate={{ opacity: 0, y: t.y - 220 }}
                exit={{ opacity: 0 }}
                style={{ 
                  position: 'fixed', left: 0, top: 0,
                  fontSize: '24px', fontWeight: 900, color: '#fff',
                  textShadow: '0 0 10px var(--neon-lime)',
                  pointerEvents: 'none', zIndex: 100
                }}
              >
                +{t.val}
              </motion.span>
            ))}
          </AnimatePresence>

          {/* Animated BOOST pill → links to Boost page */}
          <motion.div
            className="boost-pill"
            onClick={() => setActiveTab('mine')}
            animate={{ boxShadow: ['0 0 8px rgba(203,255,1,0.3)', '0 0 20px rgba(203,255,1,0.6)', '0 0 8px rgba(203,255,1,0.3)'] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              position: 'absolute', bottom: -10, cursor: 'pointer', zIndex: 20,
              background: 'var(--neon-lime)', borderRadius: 40,
              padding: '6px 18px', display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 900, color: '#000', letterSpacing: 1 }}>BOOST</span>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#000' }}>TIER {nodeTier || 1} →{(nodeTier || 1) + 1}</span>
            <div style={{ fontSize: 14, color: '#000' }}>⬆</div>
          </motion.div>
        </div>
      </div>

      {/* Production Hardened Claim Module */}
      <div className="claim-container" style={{ 
        flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '24px 20px 40px', background: 'linear-gradient(to top, var(--bg-dark) 60%, transparent)' 
      }}>
        <div style={{ width: '100%', maxWidth: '420px', display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '1px' }}>SESSION ENDS IN</span>
          <span style={{ fontSize: '11px', fontWeight: 900, color: '#fff', letterSpacing: '0.5px' }}>{formatTime(timeRemaining)}</span>
        </div>

        <button 
          className={`giant-btn shimmer-btn ${pendingMined > 0 ? '' : 'disabled'}`}
          onClick={onClaim}
          disabled={pendingMined <= 0}
          style={{ opacity: pendingMined <= 0 ? 0.3 : 1, transition: 'all 0.3s' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '1px' }}>{maturity >= 1 ? 'READY TO HATCH' : 'COLLECT MINED'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <img src="/assets/gold_coin.png" style={{ width: 14 }} alt="coin" />
              <span style={{ fontSize: '15px', fontWeight: 900 }}>{formatNumber(pendingMined)}</span>
            </div>
          </div>
        </button>
      </div>

    </div>
  );
}
