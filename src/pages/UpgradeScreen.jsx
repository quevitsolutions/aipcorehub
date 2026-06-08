import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore.js';
import { useContract } from '../hooks/useContract.js';
import { useBnbPrice } from '../hooks/useBnbPrice.js';
import { ethers } from 'ethers';
import { CONTRACTS } from '../config/constants.js';
import { AIPCORE_ABI } from '../config/abi.js';
import toast from 'react-hot-toast';

// Tier colour palette — T1 (lime) → T18 (red)
const TIER_COLORS = [
  '#A3FF12','#B4FF3A','#FFD700','#FFC107','#FF9800',
  '#FF7043','#FF5252','#F44336','#E91E63','#AB47BC',
  '#7E57C2','#5C6BC0','#42A5F5','#26C6DA','#26A69A',
  '#66BB6A','#8BC34A','#CDDC39'
];

// 18 tiers: mining rate = 100 × 1.2^(tier-1)
const TIERS = Array.from({ length: 18 }, (_, i) => ({
  tier:          i + 1,
  miningRate:    Math.round(100 * Math.pow(1.2, i)),
  dailyMining:   Math.round(100 * Math.pow(1.2, i)) * 24,
  monthlyMining: Math.round(100 * Math.pow(1.2, i)) * 720,
  color:         TIER_COLORS[i],
}));

// Hexagonal tier badge
function TierHex({ tier, color, size = 52, active, next }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: active ? `${color}22` : next ? `${color}15` : 'rgba(255,255,255,0.04)',
      border: `2px solid ${active ? color : next ? color + '88' : 'rgba(255,255,255,0.1)'}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      boxShadow: active ? `0 0 12px ${color}50` : next ? `0 0 8px ${color}30` : 'none',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: size * 0.32, fontWeight: 900, color: active ? color : next ? color : 'rgba(255,255,255,0.35)', lineHeight: 1 }}>T{tier}</span>
      <span style={{ fontSize: size * 0.16, color: active ? color : 'rgba(255,255,255,0.25)', fontWeight: 700 }}>TIER</span>
    </div>
  );
}

export default function UpgradeScreen() {
  const { localReward, nodeTier, nodeId, setActiveTab } = useGameStore();
  const { unlockTier, createNode } = useContract();
  const bnbPrice = useBnbPrice();

  const [tierCosts, setTierCosts] = useState(new Array(18).fill('0.00'));
  const [isLoading, setIsLoading] = useState(false);

  const currentTier = nodeTier || 0;
  const nextTier = nodeId ? TIERS.find(t => t.tier === currentTier + 1) : null;
  const [explorerTier, setExplorerTier] = useState(1);
  const [showAllTiers, setShowAllTiers] = useState(false);

  useEffect(() => {
    if (nodeId) {
      setExplorerTier(nextTier ? nextTier.tier : currentTier > 0 ? currentTier : 1);
    }
  }, [nodeId, currentTier]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
        const core = new ethers.Contract(CONTRACTS.AIPCORE, AIPCORE_ABI, provider);
        const costsRaw = await core.getTierCosts().catch(() => null);
        if (costsRaw) setTierCosts(costsRaw.map(c => ethers.formatEther(c)));
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, []);

  const handleRegister = async () => {
    setIsLoading(true);
    let effectiveSponsor = 1;
    const { referrerId } = useGameStore.getState();
    
    if (referrerId) {
      try {
        const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
        const contract = new ethers.Contract(CONTRACTS.AIPCORE, AIPCORE_ABI, provider);
        if (typeof referrerId === 'string' && referrerId.startsWith('0x') && referrerId.length === 42) {
          const refId = await contract.nodeId(referrerId);
          if (refId && Number(refId) > 0) effectiveSponsor = Number(refId);
        } else if (Number(referrerId) > 0) {
          effectiveSponsor = Number(referrerId);
        }
      } catch (err) {
        console.warn("Sponsor lookup failed, using default 1");
      }
    }
    
    await createNode(effectiveSponsor);
    setIsLoading(false);
  };

  const handleLevelUp = async (targetTier) => {
    if (!nodeId) return toast.error("Connect wallet first!");
    if (targetTier > 18) return toast.error("Max tier reached!");
    setIsLoading(true);
    await unlockTier(nodeId, targetTier);
    setIsLoading(false);
  };

  const usdLabel = (bnb) => bnbPrice > 0 ? `≈ $${(parseFloat(bnb || 0) * bnbPrice).toFixed(2)}` : '';

  const activeTiers    = TIERS.filter(t => nodeId && t.tier <= currentTier);
  const lockedTiers    = TIERS.filter(t => t.tier > (nextTier ? nextTier.tier : currentTier));
  const currentMining  = TIERS.find(t => t.tier === currentTier)?.miningRate || 100;

  return (
    <div className="page page-upgrade" style={{ paddingBottom: 120 }}>

      {/* ── Header ── */}
      <div style={{ padding: '10px 0 20px', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => setActiveTab('earn')}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>←</button>
        <h2 style={{ flex: 1, textAlign: 'center', fontSize: '20px', fontWeight: 900, letterSpacing: 1 }}>NODE TIERS</h2>
      </div>

      {/* ── Registration CTA (not yet activated) ── */}
      {!nodeId && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '8px 0' }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' }}>
              ACTIVATE YOUR NODE
            </h1>
            <p style={{ fontSize: 12, color: '#FFB74D', fontWeight: 600, lineHeight: 1.6, maxWidth: 290, margin: '0 auto' }}>
              Register on-chain to unlock all 18 tiers, earn real BNB and access the full AIPCore ecosystem.
            </p>
          </motion.div>

          {/* Tier 1 preview */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ background: 'linear-gradient(135deg, rgba(163,255,18,0.12) 0%, rgba(163,255,18,0.03) 100%)', border: '1px solid rgba(163,255,18,0.35)', borderRadius: 24, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <TierHex tier={1} color={TIER_COLORS[0]} size={56} next />
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>TIER 1 — ACTIVE NODE</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#A3FF12', marginTop: 3 }}>100 $AIP/hr · 2,400 $AIP/day</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
              {[
                { icon: '🚀', label: '10x Speed', sub: 'vs Free' },
                { icon: '💰', label: 'BNB Rewards', sub: 'On-chain' },
                { icon: '🏆', label: 'Pool Access', sub: 'Global' },
              ].map((b, i) => (
                <div key={i} style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: '10px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18 }}>{b.icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#fff', marginTop: 4 }}>{b.label}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{b.sub}</div>
                </div>
              ))}
            </div>
            <button className="giant-btn" onClick={handleRegister} disabled={isLoading}
              style={{ background: 'var(--neon-lime)', color: '#000', width: '100%', height: 'auto', padding: '14px 20px', borderRadius: 16, letterSpacing: 0.5, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: 15, fontWeight: 900 }}>ACTIVATE TIER 1 NODE</span>
              <span style={{ fontSize: 12, fontWeight: 800, opacity: 0.85 }}>
                {parseFloat(tierCosts[0]).toFixed(3)} BNB
                {bnbPrice > 0 && <span style={{ marginLeft: 6 }}>≈ ${(parseFloat(tierCosts[0]) * bnbPrice).toFixed(2)} USD</span>}
              </span>
            </button>
          </motion.div>

          {/* All 18 tiers preview grid */}
          <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 8 }}>ALL 18 TIERS AVAILABLE</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {TIERS.map((t, i) => (
              <div key={t.tier} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.color}30`, borderRadius: 14, padding: '10px 8px', textAlign: 'center', opacity: 0.7 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: t.color }}>T{t.tier}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{t.miningRate} $AIP/hr</div>
                <div style={{ fontSize: 8, color: '#4FC3F7', marginTop: 2 }}>{parseFloat(tierCosts[i] || 0).toFixed(3)} BNB</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Activated: Current Mining Hero ── */}
      {nodeId && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ background: 'linear-gradient(135deg, rgba(163,255,18,0.1) 0%, rgba(163,255,18,0.03) 100%)', border: '1px solid rgba(163,255,18,0.2)', borderRadius: 24, padding: '18px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#4FC3F7', letterSpacing: 2 }}>CURRENT MINING RATE</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--neon-lime)', lineHeight: 1.1, marginTop: 4 }}>
                {currentMining} <span style={{ fontSize: 14 }}>$AIP/hr</span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
                TIER {currentTier} ACTIVE
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#FF5252', letterSpacing: 2 }}>DAILY YIELD</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginTop: 4 }}>{(currentMining * 24).toLocaleString()}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#FFD700', marginTop: 3 }}>$AIP / 24 HRS</div>
            </div>
          </motion.div>

          {/* ── Income protection alert ── */}
          <motion.div
            animate={{ x: [0, -2, 2, -2, 0] }}
            transition={{ duration: 0.5, delay: 2, repeat: Infinity, repeatDelay: 5 }}
            style={{ background: 'rgba(255,59,48,0.08)', border: '1.5px solid rgba(255,59,48,0.35)', borderRadius: 18, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#FF5252', marginBottom: 2 }}>STOP MISSING INCOME!</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                You only earn from team members at or <span style={{ color: 'var(--neon-lime)' }}>below your tier</span>. Upgrade to capture 100% of your downline rewards!
              </div>
            </div>
          </motion.div>

          {/* ── INTERACTIVE TIER YIELD EXPLORER ── */}
          {(() => {
            const expTierData = TIERS[explorerTier - 1];
            const expCost = tierCosts[explorerTier - 1] || '0.00';
            const expIsActive = explorerTier <= currentTier;
            const expIsNext = explorerTier === currentTier + 1;
            const expIsLocked = explorerTier > currentTier + 1;

            return (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '20px', marginBottom: '24px', boxShadow: `0 10px 30px rgba(0,0,0,0.3)` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '2px', textTransform: 'uppercase' }}>Yield Explorer</span>
                  <span style={{ fontSize: '10px', color: expTierData.color, fontWeight: 900, background: `${expTierData.color}15`, border: `1px solid ${expTierData.color}30`, padding: '4px 10px', borderRadius: '10px', letterSpacing: '0.5px' }}>
                    {expIsActive ? 'ACTIVE ✓' : expIsNext ? 'NEXT UPGRADE ⚡' : 'LOCKED 🔒'}
                  </span>
                </div>

                {/* Slider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 900, color: 'rgba(255,255,255,0.3)' }}>T1</span>
                  <input
                    type="range"
                    min="1"
                    max="18"
                    value={explorerTier}
                    onChange={(e) => setExplorerTier(Number(e.target.value))}
                    style={{
                      flex: 1,
                      accentColor: expTierData.color,
                      height: '6px',
                      borderRadius: '3px',
                      background: 'rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '11px', fontWeight: 900, color: 'rgba(255,255,255,0.3)' }}>T18</span>
                </div>

                {/* Explorer Specs */}
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '18px', padding: '16px', border: `1px dashed ${expTierData.color}30`, marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <TierHex tier={explorerTier} color={expTierData.color} size={56} active={expIsActive} next={expIsNext} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: '#fff' }}>TIER {explorerTier} NODE</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--neon-lime)', fontWeight: 950 }}>{expTierData.miningRate} $AIP/hr</span>
                        {expIsNext && currentTier > 0 && (
                          <span style={{ fontSize: '9px', background: 'rgba(79,195,247,0.15)', color: '#4FC3F7', padding: '2px 6px', borderRadius: '6px', fontWeight: 800 }}>
                            +{expTierData.miningRate - currentMining}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Projections */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '10px' }}>
                      <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>DAILY YIELD</div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#fff', marginTop: '2px' }}>{expTierData.dailyMining.toLocaleString()}</div>
                      <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>$AIP / 24H</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '10px' }}>
                      <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>MONTHLY YIELD</div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#fff', marginTop: '2px' }}>{expTierData.monthlyMining.toLocaleString()}</div>
                      <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>$AIP / 30D</div>
                    </div>
                  </div>

                  {/* Cost Display */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '12px 14px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>UPGRADE COST</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: 950, color: expTierData.color }}>{parseFloat(expCost).toFixed(3)} BNB</div>
                      {bnbPrice > 0 && <div style={{ fontSize: '9px', color: '#4FC3F7', fontWeight: 800, marginTop: '2px' }}>{usdLabel(expCost)}</div>}
                    </div>
                  </div>
                </div>

                {/* Explorer Action Button */}
                {expIsActive ? (
                  <div style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid rgba(163,255,18,0.25)', background: 'rgba(163,255,18,0.06)', color: 'var(--neon-lime)', textAlign: 'center', fontSize: '13px', fontWeight: 950, letterSpacing: '0.5px' }}>
                    ✓ TIER {explorerTier} IS ACTIVE
                  </div>
                ) : expIsNext ? (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleLevelUp(explorerTier)}
                    disabled={isLoading}
                    style={{ width: '100%', background: expTierData.color, color: '#000', border: 'none', borderRadius: '14px', padding: '15px', fontSize: '14px', fontWeight: 900, cursor: 'pointer', letterSpacing: '0.5px', boxShadow: `0 4px 15px ${expTierData.color}40` }}
                  >
                    {isLoading ? '⟳ PROCESSING...' : `⬆ UPGRADE TO TIER ${explorerTier}`}
                  </motion.button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button disabled style={{ width: '100%', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '14px', padding: '14px', fontSize: '13px', fontWeight: 900, cursor: 'not-allowed' }}>
                      🔒 TIER LOCKED
                    </button>
                    <div style={{ fontSize: '9px', color: '#FFB74D', textAlign: 'center', fontWeight: 700 }}>
                      You must upgrade to Tier {currentTier + 1} first.
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── COMPACT ACTIVE TIERS ── */}
          {activeTiers.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '10px', fontWeight: 900, color: '#A3FF12', letterSpacing: '2px', marginBottom: '10px', textTransform: 'uppercase' }}>
                ✅ ACTIVE TIERS ({activeTiers.length}/18)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {activeTiers.map((t) => (
                  <div key={t.tier} onClick={() => setExplorerTier(t.tier)}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', background: `${t.color}12`, border: `1px solid ${t.color}35`, borderRadius: '12px', padding: '6px 12px', transition: 'all 0.2s' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.color }} />
                    <span style={{ fontSize: '11px', fontWeight: 900, color: t.color }}>T{t.tier}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{t.miningRate} AIP/h</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Max tier reached banner */}
          {currentTier >= 18 && (
            <div style={{ textAlign: 'center', padding: '30px 20px', background: 'linear-gradient(135deg, rgba(163,255,18,0.1), transparent)', border: '1px solid rgba(163,255,18,0.25)', borderRadius: '24px', marginBottom: '24px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏆</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--neon-lime)', marginBottom: '4px' }}>MAX TIER UNLOCKED!</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>All 18 tiers activated. Mining at peak efficiency.</div>
            </div>
          )}

          {/* ── COLLAPSIBLE FULL LIST ── */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px', marginBottom: '20px' }}>
            <button
              onClick={() => setShowAllTiers(!showAllTiers)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '12px', color: '#fff', fontSize: '11px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', letterSpacing: '1px' }}
            >
              <span>{showAllTiers ? '👁️ HIDE ALL TIERS LIST' : '👁️ VIEW ALL 18 TIERS LIST'}</span>
              <span>{showAllTiers ? '▲' : '▼'}</span>
            </button>

            <AnimatePresence>
              {showAllTiers && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
                    {TIERS.map((t, idx) => {
                      const isActive = t.tier <= currentTier;
                      const isNext = t.tier === currentTier + 1;
                      const isLocked = t.tier > currentTier + 1;
                      const cost = tierCosts[idx] || '0.00';
                      
                      return (
                        <div
                          key={t.tier}
                          onClick={() => { setExplorerTier(t.tier); }}
                          style={{
                            background: isActive ? `${t.color}08` : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${isActive ? `${t.color}40` : isNext ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'}`,
                            borderRadius: '16px',
                            padding: '12px',
                            position: 'relative',
                            cursor: 'pointer',
                            opacity: isLocked ? 0.6 : 1
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                            <span style={{ fontSize: '18px', fontWeight: 950, color: t.color }}>T{t.tier}</span>
                            <span style={{ fontSize: '10px' }}>{isActive ? '✓' : isNext ? '⚡' : '🔒'}</span>
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: 900, color: '#fff' }}>{t.miningRate} $AIP/h</div>
                          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: 700, marginTop: '2px' }}>{t.dailyMining.toLocaleString()} / day</div>
                          <div style={{ fontSize: '9px', fontWeight: 800, color: t.color, marginTop: '6px' }}>
                            {parseFloat(cost).toFixed(3)} BNB
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
