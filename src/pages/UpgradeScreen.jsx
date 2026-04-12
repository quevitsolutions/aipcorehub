import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore.js';
import { formatNumber } from '../utils/format.js';
import { useContract } from '../hooks/useContract.js';
import { useBnbPrice } from '../hooks/useBnbPrice.js';
import { ethers } from 'ethers';
import { CONTRACTS } from '../config/constants.js';
import { AIPCORE_ABI } from '../config/abi.js';
import toast from 'react-hot-toast';

const BOOSTERS = [
  { name: 'Basic Miner',    icon: '💻', tier: 2,  coinsPerHr: 120 },
  { name: 'Cooling Fan',    icon: '💨', tier: 3,  coinsPerHr: 140 },
  { name: 'Memory Module',  icon: '💾', tier: 4,  coinsPerHr: 160 },
  { name: 'Power Supply',   icon: '⚡', tier: 5,  coinsPerHr: 180 },
  { name: 'GPU Core',       icon: '🎮', tier: 6,  coinsPerHr: 200 },
  { name: 'Riser Cable',    icon: '🔌', tier: 7,  coinsPerHr: 240 },
  { name: 'SSD Storage',    icon: '🗄️', tier: 8,  coinsPerHr: 280 },
  { name: 'Motherboard',    icon: '📟', tier: 9,  coinsPerHr: 320 },
  { name: 'CPU Cluster',    icon: '🧠', tier: 10, coinsPerHr: 400 },
  { name: 'Network Switch', icon: '🌐', tier: 11, coinsPerHr: 500 },
  { name: 'Fiber Optic',    icon: '🛰️', tier: 12, coinsPerHr: 640 },
  { name: 'Liquid Cooling', icon: '💧', tier: 13, coinsPerHr: 800 },
  { name: 'Rack Chassis',   icon: '🏢', tier: 14, coinsPerHr: 1000 },
  { name: 'Crypto ASIC',    icon: '🏗️', tier: 15, coinsPerHr: 1280 },
  { name: 'Solar Array',    icon: '☀️', tier: 16, coinsPerHr: 1600 },
  { name: 'AI Processor',   icon: '👾', tier: 17, coinsPerHr: 2000 },
  { name: 'Quantum Core',   icon: '🔮', tier: 18, coinsPerHr: 2560 },
];

export default function UpgradeScreen() {
  const { localReward, nodeTier, nodeId, setActiveTab } = useGameStore();
  const { unlockTier, createNode } = useContract();

  const [tierCosts, setTierCosts] = useState(new Array(18).fill('0.00'));
  const [bnbPriceUsd, setBnbPriceUsd] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
        const core = new ethers.Contract(CONTRACTS.AIPCORE, AIPCORE_ABI, provider);
        const [costsRaw, priceRaw] = await Promise.all([
          core.getTierCosts().catch(() => null),
          core.bnbPrice().catch(() => 0n)
        ]);
        if (costsRaw) setTierCosts(costsRaw.map(c => ethers.formatEther(c)));
        if (priceRaw) setBnbPriceUsd(Number(priceRaw) / 1e8);
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, []);

  const handleRegister = async () => {
    setIsLoading(true);
    await createNode(36999);
    setIsLoading(false);
  };

  const handleLevelUp = async (targetTier) => {
    if (!nodeId) return toast.error("Connect wallet first!");
    if (targetTier > 18) return toast.error("Max tier reached!");
    setIsLoading(true);
    await unlockTier(nodeId, targetTier);
    setIsLoading(false);
  };

  const unlocked = BOOSTERS.filter(b => nodeId && nodeTier >= b.tier);
  const nextTier  = BOOSTERS.find(b => b.tier === nodeTier + 1);
  const locked    = BOOSTERS.filter(b => b.tier > nodeTier + 1);
  const bnbPrice  = useBnbPrice();
  const usdLabel  = (bnb) => bnbPrice > 0 ? `≈ $${(parseFloat(bnb || 0) * bnbPrice).toFixed(2)}` : '';

  const currentCoinsPerHr = nodeTier >= 2
    ? (BOOSTERS.find(b => b.tier === nodeTier)?.coinsPerHr || 100)
    : 100;

  const displayTier = nodeTier || 1;

  return (
    <div className="page page-upgrade" style={{ paddingBottom: 120 }}>

      {/* ─ Header ─ */}
      <div style={{ padding: '10px 0 20px', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => setActiveTab('earn')}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>←</button>
        <h2 style={{ flex: 1, textAlign: 'center', fontSize: '20px', fontWeight: 900 }}>MINING BOOSTERS</h2>
      </div>

      {/* ─ Registration CTA & Sales Page if not registered ─ */}
      {!nodeId && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Hero Section */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '10px 0' }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 8 }}>
              SUPERCHARGE YOUR MINING
            </h1>
            <p style={{ fontSize: 13, color: '#FFB74D', fontWeight: 600, lineHeight: 1.5, maxWidth: 300, margin: '0 auto' }}>
              Upgrade to an Active Node and unlock the full potential of the AIPCore ecosystem.
            </p>
          </motion.div>

          {/* Benefits Grid */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 12 }}>
            {[
              { icon: '🚀', title: '10x Mining Speed', desc: 'Boost your base rate from 10 coins/hr to 100+ coins/hr instantly.' },
              { icon: '💰', title: 'Earn Real BNB', desc: 'Unlock smart contract payouts. Start earning real BNB directly to your wallet.' },
              { icon: '🛡️', title: 'Income Protection', desc: 'Stay ahead of your team! Higher tiers ensure you never miss commissions from your downline.' },
              { icon: '🏆', title: 'Global Pool Rewards', desc: 'Qualify for the global matrix and premium reward pools.' },
            ].map((benefit, i) => (
              <div key={i} style={{ 
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', 
                borderRadius: 16, padding: 16, display: 'flex', alignItems: 'flex-start', gap: 16 
              }}>
                <div style={{ fontSize: 24 }}>{benefit.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{benefit.title}</div>
                  <div style={{ fontSize: 11, color: '#FFD700', lineHeight: 1.4, fontWeight: 600 }}>{benefit.desc}</div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Upgraded CTA */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ 
              background: 'linear-gradient(135deg, rgba(203,255,1,0.15) 0%, rgba(203,255,1,0.05) 100%)', 
              border: '1px solid rgba(203,255,1,0.3)', borderRadius: 24, padding: 24, 
              display: 'flex', flexDirection: 'column', alignItems: 'center' 
            }}>
            <button className="giant-btn" onClick={handleRegister} disabled={isLoading}
              style={{ 
                background: 'var(--neon-lime)', color: '#000', width: '100%', display: 'flex', flexDirection: 'column', 
                height: 'auto', padding: '16px 20px', borderRadius: 16, gap: 4, letterSpacing: '0.5px' 
              }}>
              <span style={{ fontSize: 15, fontWeight: 900 }}>ACTIVATE NODE (LEVEL 1)</span>
              <span style={{ fontSize: 13, fontWeight: 800, opacity: 0.8 }}>
                {parseFloat(tierCosts[0]).toFixed(3)} BNB <span style={{ fontSize: 11, fontWeight: 700, color: '#4FC3F7', marginLeft: 4 }}>≈ ${(parseFloat(tierCosts[0]) * bnbPrice).toFixed(2)} USD</span>
              </span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, color: '#A3FF12' }}>
              <span style={{ fontSize: 14 }}>🔒</span>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1px' }}>100% ON-CHAIN SECURE & TRANSPARENT</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* ─ Current Mining Rate Hero ─ */}
      {nodeId && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ background: 'linear-gradient(135deg, rgba(203,255,1,0.1) 0%, rgba(203,255,1,0.03) 100%)', border: '1px solid rgba(203,255,1,0.2)', borderRadius: 24, padding: '18px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#4FC3F7', letterSpacing: 2 }}>CURRENT MINING RATE</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--neon-lime)', lineHeight: 1.1, marginTop: 4 }}>
              {currentCoinsPerHr} <span style={{ fontSize: 16 }}>$AIP/hr</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>TIER {displayTier} ACTIVE</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#FF5252', letterSpacing: 2 }}>DAILY EARNINGS</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginTop: 4 }}>{(currentCoinsPerHr * 24).toLocaleString()} $AIP</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#FFFFFF', marginTop: 4 }}>24HR AUTO-MINE</div>
          </div>
        </motion.div>
      )}

      {/* ─ INCOME PROTECTION ALERT ─ */}
      {nodeId && (
        <motion.div
          animate={{ x: [0, -2, 2, -2, 0] }}
          transition={{ duration: 0.5, delay: 2, repeat: Infinity, repeatDelay: 5 }}
          style={{ 
            background: 'rgba(255, 59, 48, 0.1)',
            border: '2px solid rgba(255, 59, 48, 0.4)',
            borderRadius: 20, padding: '14px 16px', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 14
          }}>
          <div style={{ fontSize: 24 }}>⚠️</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#FF5252', marginBottom: 2 }}>STOP MISSING INCOME!</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', opacity: 0.9, lineHeight: 1.4 }}>
              You only earn rewards from team members at or <span style={{ color: 'var(--neon-lime)' }}>below your tier</span>.
              Upgrade now to stay ahead and capture 100% of your community rewards!
            </div>
          </div>
        </motion.div>
      )}

      {/* ─ NEXT UPGRADE CARD (prominently styled) ─ */}
      {nextTier && nodeId && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--neon-lime)', letterSpacing: 3, marginBottom: 10 }}>⚡ NEXT UPGRADE</div>
          <motion.div
            animate={{ boxShadow: ['0 0 15px rgba(203,255,1,0.15)', '0 0 35px rgba(203,255,1,0.3)', '0 0 15px rgba(203,255,1,0.15)'] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{ background: 'linear-gradient(135deg, rgba(203,255,1,0.08) 0%, rgba(203,255,1,0.02) 100%)', border: '2px solid rgba(203,255,1,0.4)', borderRadius: 24, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: 18, background: 'rgba(203,255,1,0.12)', border: '1px solid rgba(203,255,1,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>
                {nextTier.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{nextTier.name}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#FFB74D', marginTop: 2 }}>TIER {nextTier.tier} UNLOCK</div>
                {/* Mining gain preview */}
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#FFD700', fontWeight: 700, textDecoration: 'line-through' }}>{currentCoinsPerHr} $AIP/hr</span>
                  <span style={{ fontSize: 11, color: '#A3FF12' }}>→</span>
                  <span style={{ fontSize: 14, color: 'var(--neon-lime)', fontWeight: 900 }}>{nextTier.coinsPerHr} $AIP/hr</span>
                  <span style={{ fontSize: 10, background: 'rgba(203,255,1,0.15)', color: 'var(--neon-lime)', padding: '2px 7px', borderRadius: 20, fontWeight: 800 }}>
                    +{nextTier.coinsPerHr - currentCoinsPerHr} MORE
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#fff' }}>{(nextTier.coinsPerHr * 24).toLocaleString()} $AIP</div>
                <div style={{ fontSize: 9, color: '#4FC3F7', fontWeight: 700, marginTop: 2 }}>PER DAY</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#fff' }}>{(nextTier.coinsPerHr * 720).toLocaleString()} $AIP</div>
                <div style={{ fontSize: 9, color: '#FF5252', fontWeight: 700, marginTop: 2 }}>PER MONTH</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#fff' }}>{parseFloat(tierCosts[nextTier.tier - 1] || '0').toFixed(3)} BNB</div>
                <div style={{ fontSize: 9, color: '#FFFFFF', fontWeight: 700, marginTop: 2 }}>UNLOCK COST</div>
                {bnbPrice > 0 && <div style={{ fontSize: 10, color: '#4FC3F7', fontWeight: 700, marginTop: 2 }}>{usdLabel(tierCosts[nextTier.tier - 1])}</div>}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => handleLevelUp(nextTier.tier)}
              disabled={isLoading}
              style={{ width: '100%', marginTop: 16, background: 'var(--neon-lime)', color: '#000', border: 'none', borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 900, cursor: 'pointer', letterSpacing: 0.5 }}>
              {isLoading ? '⟳ PROCESSING...' : `⬆ UPGRADE TO TIER ${nextTier.tier}`}
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      {/* ─ COMPLETED TIERS ─ */}
      {unlocked.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#fff', letterSpacing: 3, marginBottom: 12 }}>✅ COMPLETED ({unlocked.length})</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
            {unlocked.map((b, i) => (
              <motion.div key={b.tier}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                style={{ background: 'rgba(203,255,1,0.05)', border: '1px solid rgba(203,255,1,0.2)', borderRadius: 18, padding: '14px 12px', position: 'relative', overflow: 'hidden' }}>
                {/* Green tick badge */}
                <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: 'var(--neon-lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#000' }}>✓</div>
                <div style={{ fontSize: 26, marginBottom: 8 }}>{b.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#fff', marginBottom: 2 }}>{b.name}</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--neon-lime)' }}>TIER {b.tier} ACTIVE</div>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#fff', marginTop: 6 }}>{b.coinsPerHr} $AIP/hr</div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* ─ LOCKED TIERS ─ */}
      {locked.length > 0 && nodeId && (
        <>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#FFB74D', letterSpacing: 3, marginBottom: 12 }}>🔒 LOCKED TIERS — UPGRADE TO UNLOCK</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {locked.map((b, i) => (
              <motion.div key={b.tier}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 + i * 0.03 }}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '14px 12px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 12 }}>🔒</div>
                <div style={{ fontSize: 26, marginBottom: 8, filter: 'grayscale(0.6)' }}>{b.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#fff', marginBottom: 2 }}>{b.name}</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>TIER {b.tier}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#FFD700', marginTop: 6 }}>{b.coinsPerHr} $AIP/hr</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#A3FF12', marginTop: 3 }}>
                  {parseFloat(tierCosts[b.tier - 1] || '0').toFixed(3)} BNB
                </div>
                {bnbPrice > 0 && <div style={{ fontSize: 9, fontWeight: 700, color: '#4FC3F7', marginTop: 2 }}>{usdLabel(tierCosts[b.tier - 1])}</div>}
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
