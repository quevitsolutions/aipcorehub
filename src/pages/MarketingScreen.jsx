import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore.js';
import { useContract } from '../hooks/useContract.js';
import TopBar from '../components/TopBar.jsx';

const FEATURES = [
  { icon: '⬡', label: 'MINING ENGINE', desc: '24/7 Autonomous $AIP Token Mining', color: '#CBFF01' },
  { icon: '💎', label: 'BINARY MATRIX', desc: 'Up to 18 Tiers of Team Rewards', color: '#4FFFFF' },
  { icon: '🏊', label: 'GLOBAL POOL', desc: 'Share of Protocol Revenue Pool', color: '#FF6BFF' },
  { icon: '🚀', label: 'UNLIMITED SCALE', desc: 'Build a Global Network of Miners', color: '#FF9F43' },
];

const STATS = [
  { label: 'ACTIVE MINERS', targetValue: 12489, format: v => v.toLocaleString() },
  { label: 'TOTAL DISTRIBUTED', targetValue: 2841500, format: v => `$${(v/1000).toFixed(0)}K` },
  { label: 'MAX HOURLY RATE', targetValue: 200, format: v => `${v} 🪙` },
];

function AnimatedNumber({ target, format }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCurrent(target); clearInterval(timer); }
      else setCurrent(Math.floor(start));
    }, 25);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{format(current)}</span>;
}

export default function MarketingScreen({ onConnect, onDisconnect }) {
  const { referrerId, isConnected } = useGameStore();
  const { createNode, connectWallet } = useContract();
  const [loading, setLoading] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowStats(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleActivate = async () => {
    if (!isConnected) { connectWallet(); return; }
    setLoading(true);
    const sponsorId = referrerId ? parseInt(referrerId) : 36999;
    await createNode(sponsorId);
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#05080F',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden',
    }}>
      {/* Background Glows */}
      <div style={{
        position: 'fixed', top: '-20%', left: '-20%', width: '60%', height: '60%',
        background: 'radial-gradient(circle, rgba(203, 255, 1, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'fixed', bottom: '-20%', right: '-20%', width: '70%', height: '70%',
        background: 'radial-gradient(circle, rgba(79, 255, 255, 0.04) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      {/* Top Bar */}
      <TopBar onConnect={onConnect} onDisconnect={onDisconnect} />

      <div style={{ position: 'relative', zIndex: 1, paddingTop: '80px', paddingBottom: '120px' }}>

        {/* 🔒 RESTRICTED BADGE */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ textAlign: 'center', padding: '0 20px 12px' }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255, 59, 48, 0.1)',
            border: '1px solid rgba(255, 59, 48, 0.3)',
            borderRadius: 40, padding: '6px 16px',
            fontSize: 11, fontWeight: 900, color: '#FF3B30', letterSpacing: 2
          }}>
            🔒 PROTOCOL ACCESS RESTRICTED
          </div>
        </motion.div>

        {/* HERO */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          style={{ textAlign: 'center', padding: '20px 24px 32px' }}
        >
          <h1 style={{
            fontSize: 'clamp(32px, 9vw, 52px)',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.04em',
            marginBottom: 16,
          }}>
            ACTIVATE YOUR<br />
            <span style={{
              color: 'var(--neon-lime)',
              textShadow: '0 0 40px rgba(203,255,1,0.5)',
            }}>
              MINING NODE
            </span>
          </h1>
          <p style={{
            fontSize: 15, opacity: 0.5, maxWidth: 300,
            margin: '0 auto', lineHeight: 1.6, fontWeight: 500
          }}>
            One-time node activation unlocks 24/7 automatic mining, team bonuses, and protocol pool rewards.
          </p>
        </motion.div>

        {/* STATS ROW */}
        {showStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 1, margin: '0 0 8px',
              background: 'rgba(255,255,255,0.04)',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {STATS.map((s, i) => (
              <div key={i} style={{
                padding: '16px 8px', textAlign: 'center',
                borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
              }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--neon-lime)' }}>
                  <AnimatedNumber target={s.targetValue} format={s.format} />
                </div>
                <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-dim)', marginTop: 4, letterSpacing: 1 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* FEATURES GRID */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '24px 20px' }}
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${f.color}22`,
                borderRadius: 24, padding: '20px 16px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                textAlign: 'center', gap: 10,
              }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: 18,
                background: `${f.color}15`,
                border: `1px solid ${f.color}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, boxShadow: `0 0 20px ${f.color}22`
              }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 900, color: f.color, letterSpacing: 1, marginBottom: 4 }}>
                  {f.label}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, lineHeight: 1.4 }}>
                  {f.desc}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* EARNING SIMULATION CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          style={{
            margin: '0 20px 32px',
            background: 'linear-gradient(135deg, rgba(203,255,1,0.06) 0%, rgba(203,255,1,0.02) 100%)',
            border: '1px solid rgba(203,255,1,0.15)',
            borderRadius: 28, padding: 24,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--neon-lime)', letterSpacing: 2, marginBottom: 16 }}>
            ⚡ POTENTIAL EARNINGS PREVIEW
          </div>
          {[
            { period: 'Per Hour', value: '200 🪙', note: 'Tier 2 Rate' },
            { period: 'Per Day', value: '4,800 🪙', note: 'Auto-Mined While Offline' },
            { period: 'Per Month', value: '144,000 🪙', note: 'Before Team Multipliers' },
          ].map((row, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0',
              borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{row.period}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700 }}>{row.note}</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--neon-lime)' }}>{row.value}</div>
            </div>
          ))}
        </motion.div>

        {/* REFERRAL BADGE */}
        {referrerId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            style={{ textAlign: 'center', marginBottom: 16 }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(203, 255, 1, 0.08)',
              border: '1px solid rgba(203, 255, 1, 0.2)',
              borderRadius: 40, padding: '8px 20px',
              fontSize: 12, fontWeight: 900, color: 'var(--neon-lime)',
            }}>
              🔗 SPONSORED BY NODE #{referrerId}
            </div>
          </motion.div>
        )}

        {/* ACTIVATE CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          style={{ padding: '0 20px' }}
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleActivate}
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? 'rgba(203,255,1,0.5)' : 'var(--neon-lime)',
              color: '#000',
              border: 'none',
              borderRadius: 20,
              padding: '20px',
              fontSize: 18,
              fontWeight: 900,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 50px rgba(203, 255, 1, 0.35)',
              letterSpacing: 1,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                ACTIVATING...
              </span>
            ) : isConnected ? (
              '⬡ ACTIVATE MINING NODE'
            ) : (
              '🔗 CONNECT WALLET FIRST'
            )}
          </motion.button>

          <p style={{
            textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)',
            marginTop: 14, fontWeight: 700, letterSpacing: 0.5
          }}>
            One-time activation · BSC Smart Contract · No Hidden Fees
          </p>
        </motion.div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
