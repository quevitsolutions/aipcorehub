import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const MAX_SESSION = 86400000; // 24h

// ── Local mining hook — uses a ref snapshot of claimTime so reset is instant ──
function useLocalMining(lastClaimTime, ratePerHour, hasNode) {
  const [mined, setMined] = useState(0);
  const rafRef = useRef(null);
  const claimTimeRef = useRef(lastClaimTime); // tracks the LATEST claim time without closure lag

  // keep the ref in sync when prop changes (after claim)
  useEffect(() => {
    claimTimeRef.current = lastClaimTime;
    setMined(0); // snap immediately to 0
  }, [lastClaimTime]);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (!hasNode) { setMined(0); return; }

    const tick = () => {
      const elapsed = (Date.now() - claimTimeRef.current) / 3600000;
      setMined(Math.max(0, elapsed * ratePerHour));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [ratePerHour, hasNode]);

  return mined;
}

// ── Registration CTA for non-node users ──
function RegistrationGate({ setActiveTab }) {
  const { walletAddress } = useGameStore();
  const REGISTER_URL = `https://aipcore.online/?ref=${walletAddress || ''}`;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', padding: '32px 20px', textAlign: 'center', gap: 20
    }}>
      {/* Icon */}
      <div style={{
        width: 100, height: 100, borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(163,255,18,0.15), rgba(163,255,18,0.05))',
        border: '2px solid rgba(163,255,18,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48
      }}>⛏️</div>

      <div>
        <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Node Not Activated</h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, maxWidth: 300, margin: '0 auto' }}>
          You need an active AIPCore node to mine coins. Register a node to start earning passive income.
        </p>
      </div>

      {/* Benefits */}
      {[
        { icon: '💰', text: 'Earn 100–400+ coins/hr passively' },
        { icon: '🚀', text: 'Boost up to Tier 12 — max rewards' },
        { icon: '👥', text: 'Referral & team bonuses' },
        { icon: '🌐', text: 'Global reward pool participation' },
      ].map((b, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 16px',
          width: '100%', maxWidth: 320, border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <span style={{ fontSize: 22 }}>{b.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{b.text}</span>
        </div>
      ))}

      {/* CTA */}
      <a href={REGISTER_URL} target="_blank" rel="noreferrer" style={{ width: '100%', maxWidth: 320, textDecoration: 'none' }}>
        <button style={{
          width: '100%', background: 'var(--neon-lime)', border: 'none',
          borderRadius: 18, padding: '18px', fontSize: 16, fontWeight: 900,
          color: '#000', cursor: 'pointer', boxShadow: '0 0 30px rgba(163,255,18,0.3)'
        }}>
          🚀 REGISTER A NODE →
        </button>
      </a>

      <button onClick={() => setActiveTab('contracts')}
        style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 20px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
        Learn More →
      </button>
    </div>
  );
}

export default function EarnScreen() {
  const {
    localReward, nodeTier, isPremium,
    hasNode, lastClaimTime,
    claimMined, setActiveTab, addLocalReward
  } = useGameStore();

  const [isExploding, setIsExploding] = useState(false);
  const [displayReward, setDisplayReward] = useState(localReward);
  const [claimedTasks, setClaimedTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aip-tasks') || '[]'); } catch { return []; }
  });

  // Keep displayReward in sync with store (animates upward only)
  useEffect(() => {
    setDisplayReward(localReward);
  }, [localReward]);

  const ratePerHour = (nodeTier >= 2 ? 200 : 100) * (isPremium ? 2 : 1);
  const localMined = useLocalMining(lastClaimTime, ratePerHour, hasNode);

  // Live timer — re-renders every second
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const now = Date.now();
  const elapsed = now - lastClaimTime;
  const timeRemaining = Math.max(0, MAX_SESSION - elapsed);
  const maturity = hasNode ? Math.min(1, elapsed / MAX_SESSION) : 0;

  const formatTime = (ms) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  const onClaim = () => {
    if (localMined <= 0) return;
    const amount = Math.floor(localMined);
    setIsExploding(true);

    // Update balance IMMEDIATELY in local display state
    setDisplayReward(prev => prev + amount);

    // Tell store — sets lastClaimTime = Date.now() which resets the hook
    claimMined(amount);

    toast.success(`🥚 Hatched! +${amount.toLocaleString('en-US')} coins!`, { duration: 3000 });
    setTimeout(() => setIsExploding(false), 800);
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

  // ── Non-activated users see registration gate ──
  if (!hasNode) {
    return <RegistrationGate setActiveTab={setActiveTab} />;
  }

  return (
    <div className="page-earn" style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>

      {/* Tasks button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 0 8px' }}>
        <button onClick={() => setActiveTab('tasks')}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '6px 14px', cursor: 'pointer', fontSize: 11, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>✅</span> TASKS
        </button>
      </div>

      {/* ── Balance (always reflects displayReward — updates immediately on claim) ── */}
      <div className="balance-container" style={{ margin: '4px 0 8px' }}>
        <div className="balance-main">
          <img src="/assets/gold_coin.png" className="balance-coin" style={{ width: 40, clipPath: 'circle(50%)' }} alt="coin" />
          <span className="balance-value" style={{ fontSize: 40 }}>
            {Math.floor(displayReward).toLocaleString('en-US')}
          </span>
        </div>
      </div>

      {/* ── Egg Zone ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 240 }}>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* Maturity circle ring */}
          <svg style={{ position: 'absolute', top: '50%', left: '50%', width: 260, height: 260, transform: 'translate(-50%, -50%) rotate(-90deg)', pointerEvents: 'none' }}>
            <circle cx="130" cy="130" r="120" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
            <motion.circle cx="130" cy="130" r="120" fill="none" stroke="var(--neon-lime)" strokeWidth="3"
              strokeDasharray="754"
              animate={{ strokeDashoffset: 754 * (1 - maturity) }}
              transition={{ duration: 1, ease: 'linear' }}
              strokeLinecap="round" />
          </svg>

          <AnimatePresence>
            {isExploding && (
              <motion.div initial={{ opacity: 1, scale: 0.8 }} animate={{ opacity: 0, scale: 2 }}
                style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, var(--neon-lime) 0%, transparent 70%)', zIndex: 5, borderRadius: '50%' }} />
            )}
          </AnimatePresence>

          {/* EGG — circle-masked, frameless */}
          <div style={{ position: 'relative', width: 210, height: 210, zIndex: 10 }}>
            <img src="/assets/egg_orange.png"
              style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'screen', clipPath: 'circle(48% at 50% 50%)', filter: `drop-shadow(0 0 ${20 * maturity}px rgba(203,255,1,0.5))` }}
              alt="Mining Egg" />
          </div>

          {/* BOOST pill */}
          <motion.div onClick={() => setActiveTab('mine')}
            animate={{ boxShadow: ['0 0 8px rgba(203,255,1,0.3)', '0 0 22px rgba(203,255,1,0.7)', '0 0 8px rgba(203,255,1,0.3)'] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{ marginTop: 8, background: 'var(--neon-lime)', borderRadius: 40, padding: '7px 20px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', zIndex: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#000', letterSpacing: 1 }}>BOOST</span>
            <span style={{ fontSize: 11, fontWeight: 900, color: 'rgba(0,0,0,0.6)' }}>T{displayTier}→{displayTier + 1} ⬆</span>
          </motion.div>
        </div>
      </div>

      {/* ── Claim Module ── */}
      <div style={{ flexShrink: 0, padding: '12px 0 0px', background: 'linear-gradient(to top, var(--bg-dark) 60%, transparent)' }}>
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
              <img src="/assets/gold_coin.png" style={{ width: 14, clipPath: 'circle(50%)' }} alt="coin" />
              <span style={{ fontSize: 15, fontWeight: 900, color: localMined > 0 ? '#000' : 'rgba(255,255,255,0.3)' }}>
                {Math.floor(localMined).toLocaleString('en-US')}
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
