import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { AnimatedCounter, GlowCard, SectionHeader } from '../components/UI.jsx'

const TIERS = [
  { level: 1,  label: 'Genesis',   price: '0.05 BNB',  mine: '100🪙/hr',  color: '#aaa' },
  { level: 2,  label: 'Pioneer',   price: '0.1 BNB',   mine: '200🪙/hr',  color: '#CD7F32' },
  { level: 3,  label: 'Explorer',  price: '0.2 BNB',   mine: '300🪙/hr',  color: '#C0C0C0' },
  { level: 4,  label: 'Builder',   price: '0.4 BNB',   mine: '400🪙/hr',  color: '#FFD700' },
  { level: 5,  label: 'Architect', price: '0.8 BNB',   mine: '500🪙/hr',  color: '#4FFFFF' },
  { level: 6,  label: 'Nexus',     price: '1.6 BNB',   mine: '600🪙/hr',  color: '#4FC3F7' },
  { level: 7,  label: 'Validator', price: '3.2 BNB',   mine: '700🪙/hr',  color: '#FF9F43' },
  { level: 8,  label: 'Sentinel',  price: '6.4 BNB',   mine: '800🪙/hr',  color: '#FF6BFF' },
  { level: 9,  label: 'Oracle',    price: '12.8 BNB',  mine: '900🪙/hr',  color: '#CBFF01' },
  { level: 10, label: 'Sovereign', price: '25.6 BNB',  mine: '1000🪙/hr', color: '#CBFF01' },
]

const INCOME_STREAMS = [
  {
    icon: '💰', color: '#CBFF01',
    title: 'Sponsor / Referral',
    pct: '10%',
    rows: [
      { label: 'On Registration',     value: '10%' },
      { label: 'On All 18 Upgrades',  value: '10%' },
      { label: 'Max Referrals',        value: 'Unlimited' },
      { label: 'Duration',             value: 'Lifetime' },
    ],
  },
  {
    icon: '🔷', color: '#4FFFFF',
    title: 'Binary Matrix',
    pct: '70%',
    rows: [
      { label: 'Pool Share',           value: '70%' },
      { label: 'Source',               value: 'All Volume' },
      { label: 'Depth',                value: '18 Levels' },
      { label: 'Trigger',              value: 'Matching Tier' },
    ],
  },
  {
    icon: '⬡', color: '#FF6BFF',
    title: 'Level Income',
    pct: '~15%',
    rows: [
      { label: 'Pool Share',           value: '~15%' },
      { label: 'Trigger',              value: 'Tier Unlock' },
      { label: 'Tier Range',           value: '1 → 18' },
      { label: 'Mining Rate',          value: '10→200 🪙/hr' },
    ],
  },
  {
    icon: '🏊', color: '#FF9F43',
    title: 'Global Pool',
    pct: '5%',
    rows: [
      { label: 'Pool Share',           value: '5%' },
      { label: 'Access',               value: 'Qualified' },
      { label: 'Distribution',         value: 'Auto On-chain' },
      { label: 'Claim',                value: 'Any Time' },
    ],
  },
]

const SIMULATION = [
  { period: '1 Hour',    mining: '200 🪙',     bnb: '—',          note: 'Tier 2 Mining Rate' },
  { period: '1 Day',     mining: '4,800 🪙',   bnb: '~0.002 BNB', note: 'From 1 referral/day' },
  { period: '1 Week',    mining: '33,600 🪙',  bnb: '~0.05 BNB',  note: '5 active referrals' },
  { period: '1 Month',   mining: '144,000 🪙', bnb: '~0.5 BNB',   note: 'Growing network' },
  { period: '6 Months',  mining: '864,000 🪙', bnb: '~5+ BNB',    note: 'Matrix compounding' },
]

export default function EarningsPage() {
  const [activeTier, setActiveTier] = useState(0)

  return (
    <main style={{ paddingTop: 104 }}>

      {/* Hero */}
      <section className="section" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(203,255,1,0.07) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
            <div className="section-label">⚡ EARNINGS BREAKDOWN</div>
            <h1 className="section-title">Four Income Streams.<br /><span className="text-lime">One Activation.</span></h1>
            <p className="section-desc" style={{ margin: '0 auto' }}>
              See exactly how BNB flows through the protocol and into your wallet — every stream explained with real numbers.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 4 Income Stream Cards */}
      <section style={{ paddingBottom: 80 }}>
        <div className="container">
          <div className="grid-2" style={{ gap: 20 }}>
            {INCOME_STREAMS.map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <GlowCard color={s.color}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 16, flexShrink: 0,
                      background: `${s.color}12`, border: `1px solid ${s.color}35`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                    }}>{s.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{s.title}</div>
                    </div>
                    <div style={{ fontSize: 36, fontWeight: 900, color: s.color }}>{s.pct}</div>
                  </div>
                  {/* Data rows */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {s.rows.map((row, j) => (
                      <div key={j} style={{
                        padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10,
                      }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>{row.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{row.value}</div>
                      </div>
                    ))}
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Simulation */}
      <section className="section" style={{ background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <SectionHeader label="SIMULATION" icon="📊" title="What Could You Earn?" desc="Illustrative projections based on average network activity. Actual results depend on your referral performance and market conditions." center />
          <div className="card" style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Period', 'Mining Tokens', 'BNB Income', 'Scenario'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1.5, borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SIMULATION.map((row, i) => (
                    <motion.tr key={i}
                      initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                      style={{ borderBottom: i < SIMULATION.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 800, fontSize: 14 }}>{row.period}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 900, fontSize: 14, color: 'var(--neon-lime)' }}>{row.mining}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 900, fontSize: 14, color: 'var(--neon-cyan)' }}>{row.bnb}</td>
                      <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{row.note}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(255,149,0,0.07)', border: '1px solid rgba(255,149,0,0.2)', borderRadius: 10 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,149,0,0.9)', fontWeight: 600, lineHeight: 1.6 }}>
                ⚠️ Disclaimer: These figures are illustrative estimates only. Crypto investments carry risk. Past protocol performance does not guarantee future results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tier Levels */}
      <section className="section">
        <div className="container">
          <SectionHeader label="18 UPGRADE TIERS" icon="⬡" title="Unlock More, Earn More" desc="Each tier upgrade unlocks higher mining rates and deeper matrix eligibility — compounding your earnings." center />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 32 }}>
            {TIERS.map((t, i) => (
              <button key={i} onClick={() => setActiveTier(i)}
                style={{
                  padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 800,
                  background: activeTier === i ? t.color : 'rgba(255,255,255,0.05)',
                  color: activeTier === i ? '#000' : 'rgba(255,255,255,0.7)',
                  border: `1px solid ${activeTier === i ? t.color : 'rgba(255,255,255,0.1)'}`,
                  transition: 'all 0.2s',
                }}>
                L{t.level} {t.label}
              </button>
            ))}
          </div>

          <motion.div key={activeTier} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="card" style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', borderColor: `${TIERS[activeTier].color}40` }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⬡</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: TIERS[activeTier].color, marginBottom: 4 }}>
                Tier {TIERS[activeTier].level} — {TIERS[activeTier].label}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
                <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>UPGRADE COST</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: TIERS[activeTier].color }}>{TIERS[activeTier].price}</div>
                </div>
                <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>MINING RATE</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: TIERS[activeTier].color }}>{TIERS[activeTier].mine}</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ paddingBottom: 100, textAlign: 'center' }}>
        <div className="container">
          <h2 className="section-title">Start Earning Today</h2>
          <p className="section-desc" style={{ margin: '0 auto 36px' }}>All streams activate with your first node registration.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/join" className="btn-primary" style={{ fontSize: 16, padding: '16px 40px' }}>Activate Node ⚡</Link>
            <Link to="/features" className="btn-outline">See All Features <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>
    </main>
  )
}
