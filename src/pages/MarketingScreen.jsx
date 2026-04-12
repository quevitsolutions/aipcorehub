import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore.js';
import { useContract } from '../hooks/useContract.js';
import TopBar from '../components/TopBar.jsx';

/* ─── Live Stat Counter ─── */
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

/* ─── Income Stream Data (from contract ABIs) ─── */
const INCOME_STREAMS = [
  {
    icon: '💰',
    title: 'SPONSOR / REFERRAL INCOME',
    badge: '10% — REGISTRATION & ALL 18 UPGRADES',
    color: '#CBFF01',
    desc: 'Earn 10% of every BNB paid by your direct referrals — at registration AND each time they unlock a new tier up to Level 18. One sponsor = lifetime passive income stream.',
    rows: [
      { label: 'Distribution Share', value: '10%' },
      { label: 'Referral Registration', value: '10% of entry' },
      { label: 'Tier 1→18 Upgrades', value: '10% per upgrade' },
      { label: 'Duration', value: 'Lifetime' },
    ]
  },
  {
    icon: '🔷',
    title: 'BINARY MATRIX INCOME',
    badge: '70% — LARGEST POOL FROM ALL VOLUME',
    color: '#4FFFFF',
    desc: '70% of every registration and upgrade flows through the binary matrix to eligible upline nodes. The deeper your matrix, the more volume flows — automatically distributed by the smart contract.',
    rows: [
      { label: 'Distribution Share', value: '70%' },
      { label: 'Source', value: 'All Registrations' },
      { label: 'Qualifying Trigger', value: 'Matching Tier' },
      { label: 'Depth', value: '18 Matrix Levels' },
    ]
  },
  {
    icon: '⬡',
    title: 'LEVEL / TIER INCOME',
    badge: '~15% — PER TIER UNLOCK ACROSS NETWORK',
    color: '#FF6BFF',
    desc: 'Approximately 15% of all network volume is distributed as level income when qualified uplines match the unlocking tier. Upgrading yourself to higher tiers earns more from deeper network upgrades.',
    rows: [
      { label: 'Distribution Share', value: '~15%' },
      { label: 'Trigger', value: 'Tier Unlock Events' },
      { label: 'Tier Range', value: 'Level 1 → 18' },
      { label: 'Mining Rate', value: '10 → 200 🪙/hr' },
    ]
  },
  {
    icon: '🏊',
    title: 'GLOBAL REWARD POOL',
    badge: '5% — PROTOCOL REVENUE SHARE',
    color: '#FF9F43',
    desc: '5% of all protocol volume is reserved for the Global Reward Pool. Qualified nodes meeting team size, tier, and direct count requirements earn an automatic share of this pool on-chain.',
    rows: [
      { label: 'Distribution Share', value: '5%' },
      { label: 'Pool Access', value: 'Qualified Nodes Only' },
      { label: 'Distribution', value: 'Auto Smart Contract' },
      { label: 'Claim', value: 'On-Chain Anytime' },
    ]
  },
];

export default function MarketingScreen() {
  const { referrerId, isConnected, bnbBalance, globalStats, fetchGlobalProtocolStats } = useGameStore();

  const protocolStats = [
    { label: 'ACTIVE MINERS', target: globalStats?.active_nodes || 12489, format: v => v.toLocaleString() },
    { label: 'PROTOCOL VOLUME', target: globalStats?.total_volume_bnb || 2841, format: v => `${v.toLocaleString()} BNB` },
    { label: 'INCOME STREAMS', target: 4, format: v => `${v} TYPES` },
  ];
  const { createNode, connectWallet } = useContract();
  const [loading, setLoading] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const hasEnoughBnb = parseFloat(bnbBalance || '0') >= 0.01;

  useEffect(() => {
    fetchGlobalProtocolStats();
    const t = setTimeout(() => setShowStats(true), 600);
    return () => clearTimeout(t);
  }, [fetchGlobalProtocolStats]);

  const handleActivate = async () => {
    if (!isConnected) { connectWallet(); return; }
    setLoading(true);
    const sponsorId = referrerId ? parseInt(referrerId) : 36999;
    await createNode(sponsorId);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#05080F', color: '#fff', overflowX: 'hidden', fontFamily: 'Outfit, sans-serif' }}>
      {/* Ambient Glows */}
      <div style={{ position: 'fixed', top: '-20%', left: '-15%', width: '55%', height: '55%', background: 'radial-gradient(circle, rgba(203,255,1,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-20%', right: '-15%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(79,255,255,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <TopBar onConnect={onConnect} onDisconnect={onDisconnect} />

      <div style={{ position: 'relative', zIndex: 1, paddingTop: 80, paddingBottom: 120 }}>

        {/* ─ RESTRICTED BADGE ─ */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ textAlign: 'center', padding: '12px 20px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,59,48,0.12)', border: '1px solid rgba(255,59,48,0.35)',
            borderRadius: 40, padding: '7px 18px', fontSize: 11, fontWeight: 900, color: '#FF3B30', letterSpacing: 2
          }}>
            🔒 PROTOCOL ACCESS RESTRICTED
          </div>
        </motion.div>

        {/* ─ HERO ─ */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}
          style={{ textAlign: 'center', padding: '12px 24px 28px' }}>
          <h1 style={{ fontSize: 'clamp(30px, 9vw, 50px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: 14 }}>
            ACTIVATE YOUR<br />
            <span style={{ color: 'var(--neon-lime)', textShadow: '0 0 40px rgba(203,255,1,0.5)' }}>MINING NODE</span>
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', maxWidth: 320, margin: '0 auto', lineHeight: 1.6, fontWeight: 500 }}>
            One activation. Four income streams. 18 levels deep. Passive rewards 24/7.
          </p>
        </motion.div>

        {/* ─ LIVE STATS ─ */}
        {showStats && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 }}>
            {protocolStats.map((s, i) => (
              <div key={i} style={{ padding: '16px 8px', textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--neon-lime)' }}>
                  <AnimatedNumber target={s.target} format={s.format} />
                </div>
                <div style={{ fontSize: 9, fontWeight: 800, color: '#fff', marginTop: 4, letterSpacing: 1, opacity: 0.6 }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ─ 100% DISTRIBUTION BAR ─ */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{ margin: '16px 20px 4px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '18px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#fff', letterSpacing: 2, marginBottom: 12, opacity: 0.7 }}>◈ 100% COMMUNITY DISTRIBUTION</div>
          {/* Stacked bar */}
          <div style={{ display: 'flex', height: 10, borderRadius: 8, overflow: 'hidden', marginBottom: 14, gap: 2 }}>
            <div style={{ width: '70%', background: '#4FFFFF', borderRadius: '8px 0 0 8px' }} />
            <div style={{ width: '15%', background: '#FF6BFF' }} />
            <div style={{ width: '10%', background: '#CBFF01' }} />
            <div style={{ width: '5%',  background: '#FF9F43', borderRadius: '0 8px 8px 0' }} />
          </div>
          {/* Legend */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
            {[
              { color: '#4FFFFF', label: 'Binary Matrix',     pct: '70%' },
              { color: '#FF6BFF', label: 'Level Income',      pct: '~15%' },
              { color: '#CBFF01', label: 'Sponsor Referral',  pct: '10%' },
              { color: '#FF9F43', label: 'Global Pool',       pct: '5%' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 700, flex: 1 }}>{item.label}</span>
                <span style={{ fontSize: 11, color: '#fff', fontWeight: 900 }}>{item.pct}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─ 4 INCOME STREAMS ─ */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--neon-lime)', letterSpacing: 3, marginBottom: 16, textAlign: 'center' }}>
            ◈ 4 INCOME STREAMS FROM CONTRACTS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {INCOME_STREAMS.map((stream, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                style={{
                  background: `linear-gradient(135deg, ${stream.color}09 0%, rgba(255,255,255,0.01) 100%)`,
                  border: `1px solid ${stream.color}25`,
                  borderLeft: `3px solid ${stream.color}`,
                  borderRadius: 20, padding: '20px',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                    background: `${stream.color}18`, border: `1px solid ${stream.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, boxShadow: `0 0 16px ${stream.color}20`
                  }}>
                    {stream.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#fff', letterSpacing: 0.5 }}>{stream.title}</div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: stream.color, marginTop: 3, letterSpacing: 1 }}>{stream.badge}</div>
                  </div>
                </div>

                {/* Description */}
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)', lineHeight: 1.6, fontWeight: 500, margin: '0 0 14px' }}>
                  {stream.desc}
                </p>

                {/* Data Rows */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
                  {stream.rows.map((row, j) => (
                    <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: 700 }}>{row.label}</span>
                      <span style={{ fontSize: 10, color: '#fff', fontWeight: 900 }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ─ EARNINGS SIMULATION ─ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          style={{ margin: '24px 20px', background: 'linear-gradient(135deg, rgba(203,255,1,0.07) 0%, rgba(203,255,1,0.02) 100%)', border: '1px solid rgba(203,255,1,0.18)', borderRadius: 24, padding: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--neon-lime)', letterSpacing: 2, marginBottom: 16 }}>⚡ MINING EARNINGS PREVIEW</div>
          {[
            { period: 'Per Hour', value: '200 🪙', note: 'Tier 2 Auto-Mining Rate' },
            { period: 'Per Day', value: '4,800 🪙', note: 'Offline Passive Mining' },
            { period: 'Per Month', value: '144,000 🪙', note: 'Before Team Multipliers' },
            { period: 'Referral Bonus', value: '10% BNB', note: 'Each Direct Referral Entry' },
            { period: 'Matrix Income', value: '70% Share', note: 'When Matrix Eligible' },
          ].map((row, i, arr) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{row.period}</div>
                <div style={{ fontSize: 10, color: '#A3FF12', fontWeight: 700, marginTop: 2 }}>{row.note}</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--neon-lime)' }}>{row.value}</div>
            </div>
          ))}
        </motion.div>

        {/* ─ HOW IT WORKS ─ */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
          style={{ margin: '0 20px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#fff', letterSpacing: 2, marginBottom: 16 }}>◆ HOW IT WORKS</div>
          {[
            { step: '01', text: 'Connect your BSC wallet', sub: 'MetaMask or WalletConnect' },
            { step: '02', text: 'Activate your Mining Node', sub: 'One-time BNB payment to contract' },
            { step: '03', text: 'Start mining $AIP instantly', sub: '100 coins/hr auto-credited' },
            { step: '04', text: 'Sponsor others & earn 10%', sub: 'From registration + all 18 upgrades' },
            { step: '05', text: 'Upgrade tiers to unlock matrix', sub: 'Earn 70% of downline volume' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '10px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(203,255,1,0.1)', border: '1px solid rgba(203,255,1,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: 'var(--neon-lime)', flexShrink: 0 }}>
                {item.step}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{item.text}</div>
                <div style={{ fontSize: 11, color: '#4FC3F7', fontWeight: 600, marginTop: 2 }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ─ REFERRAL BADGE ─ */}
        {referrerId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
            style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(203,255,1,0.08)', border: '1px solid rgba(203,255,1,0.25)', borderRadius: 40, padding: '8px 20px', fontSize: 12, fontWeight: 900, color: 'var(--neon-lime)' }}>
              🔗 SPONSORED BY NODE #{referrerId}
            </div>
          </motion.div>
        )}

        {/* ─ BNB WARNING ─ */}
        {isConnected && !hasEnoughBnb && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ margin: '0 20px 16px', background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.3)', borderRadius: 16, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#FF9500' }}>⚠️ LOW BNB BALANCE</div>
              <div style={{ fontSize: 11, color: '#FF5252', fontWeight: 700, marginTop: 2 }}>
                You have {parseFloat(bnbBalance || 0).toFixed(4)} BNB — need min ~0.05 BNB
              </div>
            </div>
            <a href="https://www.binance.com/en/buy-sell-crypto?crypto=BNB" target="_blank" rel="noreferrer"
              style={{ background: '#FF9500', color: '#000', padding: '8px 14px', borderRadius: 10, fontSize: 11, fontWeight: 900, textDecoration: 'none', flexShrink: 0, marginLeft: 12 }}>
              GET BNB
            </a>
          </motion.div>
        )}

        {/* ─ CTA BUTTON ─ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
          style={{ padding: '0 20px' }}>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={handleActivate} disabled={loading}
            style={{
              width: '100%', background: loading ? 'rgba(203,255,1,0.5)' : 'var(--neon-lime)', color: '#000',
              border: 'none', borderRadius: 20, padding: '20px', fontSize: 18, fontWeight: 900,
              cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 0 50px rgba(203,255,1,0.35)', letterSpacing: 1
            }}>
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> ACTIVATING...</span>
              : isConnected ? '⬡ ACTIVATE MINING NODE' : '🔗 CONNECT WALLET FIRST'}
          </motion.button>
          <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 12, fontWeight: 700, letterSpacing: 0.5 }}>
            One-time activation · BSC Smart Contract · No Hidden Fees
          </p>
        </motion.div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
