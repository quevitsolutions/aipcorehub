import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { formatNumber } from '../utils/format.js';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_TASKS = [
  { id: 'tg_join',  icon: '✈️', label: 'Telegram',  reward: 200000, url: 'https://t.me/AIPCoreOfficial' },
  { id: 'tg_chat',  icon: '💬', label: 'TG Chat',   reward: 150000, url: 'https://t.me/AIPCoreChat' },
  { id: 'x_follow', icon: '𝕏',  label: 'Twitter',   reward: 100000, url: 'https://x.com/AIPCore' },
];

function useLocalMining(lastClaimTime, ratePerHour, hasNode) {
  const [mined, setMined] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!hasNode) { setMined(0); return; }
    const tick = () => {
      const elapsed = (Date.now() - lastClaimTime) / 3600000; // hours
      setMined(Math.max(0, parseFloat((elapsed * ratePerHour).toFixed(2))));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [lastClaimTime, ratePerHour, hasNode]);

  return mined;
}

export default function EarnScreen() {
  const {
    localReward, nodeTier, isPremium, energy, maxEnergy,
    hasNode, nodeId, lastClaimTime,
    handleTap, claimMined, setActiveTab, addLocalReward
  } = useGameStore();

  const [taps, setTaps] = useState([]);
  const [isExploding, setIsExploding] = useState(false);
  const [claimedTasks, setClaimedTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aip-tasks') || '[]'); } catch { return []; }
  });

  const ratePerHour = (nodeTier >= 2 ? 200 : 100) * (isPremium ? 2 : 1);
  // Use local real-time mining calc — no server dependency
  const localMined = useLocalMining(lastClaimTime, ratePerHour, hasNode);
  const MAX_SESSION = 86400000; // 24h in ms
  const elapsed = Date.now() - lastClaimTime;
  const timeRemaining = Math.max(0, MAX_SESSION - elapsed);
  const maturity = hasNode ? Math.min(1, elapsed / MAX_SESSION) : 0;

  const formatTime = (ms) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  // Keep time display updated
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const handleTapInteraction = useCallback((e) => {
    const res = handleTap();
    if (res.status === 'SUCCESS' || res.status === 'DEMO') {
      const touch = e.touches ? e.touches[0] : e;
      const id = Date.now();
      setTaps(prev => [...prev, { id, x: touch.clientX, y: touch.clientY, val: (ratePerHour / 3600).toFixed(2) }]);
      setTimeout(() => setTaps(prev => prev.filter(t => t.id !== id)), 800);
    }
  }, [handleTap, ratePerHour]);

  const onClaim = () => {
    if (localMined <= 0) return;
    setIsExploding(true);
    setTimeout(() => { claimMined(); setIsExploding(false); }, 800);
  };

  const handleTaskClaim = (task) => {
    if (claimedTasks.includes(task.id)) return;
    window.open(task.url, '_blank');
    const updated = [...claimedTasks, task.id];
    setClaimedTasks(updated);
    localStorage.setItem('aip-tasks', JSON.stringify(updated));
    addLocalReward(task.reward);
  };

  const displayTier = Math.max(1, nodeTier || 1);

  return (
    <div className="page-earn" style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }}>

      <div style={{ flexShrink: 0, padding: '10px 0 8px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        {/* Energy pill */}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--neon-lime)' }}>{energy}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>/ {maxEnergy}</span>
          </div>
          <div style={{ width: 60, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 3, overflow: 'hidden' }}>
            <div style={{ width: `${(energy / maxEnergy) * 100}%`, height: '100%', background: 'var(--neon-lime)', boxShadow: '0 0 8px var(--neon-lime)', transition: 'width 0.5s' }} />
          </div>
        </div>
      </div>

      {/* ── Social Task Strip ── */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 6, marginBottom: 6, overflowX: 'auto', paddingBottom: 2 }}
        className="no-scrollbar">
        {QUICK_TASKS.map(task => {
          const done = claimedTasks.includes(task.id);
          return (
            <button key={task.id} onClick={() => handleTaskClaim(task)} disabled={done}
              style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                background: done ? 'rgba(203,255,1,0.08)' : 'rgba(255,255,255,0.04)',
                border: done ? '1px solid rgba(203,255,1,0.3)' : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 30, padding: '5px 12px', cursor: done ? 'default' : 'pointer',
                fontSize: 10, fontWeight: 800, color: done ? 'var(--neon-lime)' : '#fff', whiteSpace: 'nowrap'
              }}>
              {task.icon} {task.label} {done ? '✓' : <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>+{formatNumber(task.reward)}</span>}
            </button>
          );
        })}
        <button onClick={() => setActiveTab('tasks')}
          style={{ flexShrink: 0, background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 30, padding: '5px 12px', cursor: 'pointer', fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
          MORE →
        </button>
      </div>

      {/* ── Balance ── */}
      <div className="balance-container" style={{ margin: '4px 0 8px' }}>
        <div className="balance-main">
          <img src="/assets/gold_coin.png" className="balance-coin" style={{ width: 40 }} alt="coin" />
          <span className="balance-value" style={{ fontSize: 44 }}>{formatNumber(localReward)}</span>
        </div>
      </div>

      {/* ── Egg Zone (no frame/border) ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* Maturity circle ring — outer only */}
          <svg style={{ position: 'absolute', top: -20, left: -20, width: 280, height: 280, transform: 'rotate(-90deg)', pointerEvents: 'none' }}>
            <circle cx="140" cy="140" r="128" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
            <motion.circle cx="140" cy="140" r="128" fill="none" stroke="var(--neon-lime)" strokeWidth="3"
              strokeDasharray="804"
              animate={{ strokeDashoffset: 804 * (1 - maturity) }}
              transition={{ duration: 1, ease: 'linear' }}
              strokeLinecap="round" />
          </svg>

          <AnimatePresence>
            {isExploding && (
              <motion.div initial={{ opacity: 1, scale: 0.8 }} animate={{ opacity: 0, scale: 2 }}
                style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, var(--neon-lime) 0%, transparent 70%)', zIndex: 5, borderRadius: '50%' }} />
            )}
          </AnimatePresence>

          {/* EGG — no wrapper box, no background */}
          <motion.div
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            style={{ position: 'relative', width: 210, height: 210, cursor: 'pointer', zIndex: 10 }}
            onClick={handleTapInteraction}
          >
            <img src="/assets/egg_orange.png"
              style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'screen', filter: `drop-shadow(0 0 ${20 * maturity}px rgba(203,255,1,0.5))` }}
              alt="Mining Egg" />
          </motion.div>

          {/* Floating coin numbers */}
          <AnimatePresence>
            {taps.map(t => (
              <motion.span key={t.id}
                initial={{ opacity: 1, y: t.y - 120, x: t.x - 120 }}
                animate={{ opacity: 0, y: t.y - 220 }}
                exit={{ opacity: 0 }}
                style={{ position: 'fixed', left: 0, top: 0, fontSize: 22, fontWeight: 900, color: '#fff', textShadow: '0 0 10px var(--neon-lime)', pointerEvents: 'none', zIndex: 100 }}>
                +{t.val}
              </motion.span>
            ))}
          </AnimatePresence>

          {/* BOOST pill — pulsing, links to Boost page */}
          <motion.div onClick={() => setActiveTab('mine')}
            animate={{ boxShadow: ['0 0 8px rgba(203,255,1,0.3)', '0 0 22px rgba(203,255,1,0.7)', '0 0 8px rgba(203,255,1,0.3)'] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{ marginTop: 8, background: 'var(--neon-lime)', borderRadius: 40, padding: '7px 20px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', zIndex: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: '#000', letterSpacing: 1 }}>BOOST</span>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#000' }}>TIER {displayTier}→{displayTier + 1}</span>
            <span style={{ fontSize: 14, color: '#000' }}>⬆</span>
          </motion.div>
        </div>
      </div>

      {/* ── Claim Module ── */}
      <div style={{ flexShrink: 0, padding: '12px 0 40px', background: 'linear-gradient(to top, var(--bg-dark) 60%, transparent)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.45)', letterSpacing: 1 }}>SESSION ENDS IN</span>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>{formatTime(timeRemaining)}</span>
        </div>

        <button
          onClick={onClaim}
          disabled={localMined <= 0}
          style={{
            width: '100%', background: localMined > 0 ? 'var(--neon-lime)' : 'rgba(255,255,255,0.08)',
            border: 'none', borderRadius: 20, padding: '18px', cursor: localMined > 0 ? 'pointer' : 'default',
            boxShadow: localMined > 0 ? '0 0 30px rgba(203,255,1,0.3)' : 'none',
            transition: 'all 0.3s'
          }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: localMined > 0 ? '#000' : 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>
              {maturity >= 1 ? '🥚 READY TO HATCH' : 'COLLECT MINED'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <img src="/assets/gold_coin.png" style={{ width: 14 }} alt="coin" />
              <span style={{ fontSize: 15, fontWeight: 900, color: localMined > 0 ? '#000' : 'rgba(255,255,255,0.3)' }}>
                {formatNumber(Math.floor(localMined))}
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
