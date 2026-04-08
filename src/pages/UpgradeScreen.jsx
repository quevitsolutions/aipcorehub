import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { formatNumber } from '../utils/format.js';
import { useContract } from '../hooks/useContract.js';
import { ethers } from 'ethers';
import { CONTRACTS } from '../../contracts/config.js';
import { AIPCORE_ABI } from '../../contracts/abi.js';
import toast from 'react-hot-toast';

export default function UpgradeScreen() {
  const { 
    localReward, nodeTier, nodeId, miningRate, maxEnergy,
    setActiveTab 
  } = useGameStore();
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
      } catch (err) {
        console.error("Fetch data error:", err);
      }
    };
    fetchData();
  }, []);

  const handleRegister = async () => {
    setIsLoading(true);
    await createNode(36999); // Use genesis as default sponsor
    setIsLoading(false);
  };

  const handleLevelUp = async (targetTier) => {
    if (!nodeId) return toast.error("Connect wallet first!");
    if (targetTier > 18) return toast.error("Max tier reached!");
    
    setIsLoading(true);
    await unlockTier(nodeId, targetTier);
    setIsLoading(false);
  };

  const boosters = [
    { name: 'Basic Miner', icon: '💻', tier: 2, level: 2 },
    { name: 'Cooling Fan', icon: '💨', tier: 3, level: 3 },
    { name: 'Memory Module', icon: '💾', tier: 4, level: 4 },
    { name: 'Power Supply', icon: '⚡', tier: 5, level: 5 },
    { name: 'GPU Core', icon: '🎮', tier: 6, level: 6 },
    { name: 'Riser Cable', icon: '🔌', tier: 7, level: 7 },
    { name: 'SSD Storage', icon: '🗄️', tier: 8, level: 8 },
    { name: 'Motherboard', icon: '📟', tier: 9, level: 9 },
    { name: 'CPU Cluster', icon: '🧠', tier: 10, level: 10 },
    { name: 'Network Switch', icon: '🌐', tier: 11, level: 11 },
    { name: 'Fiber Optic', icon: '🛰️', tier: 12, level: 12 },
    { name: 'Liquid Cooling', icon: '💧', tier: 13, level: 13 },
    { name: 'Rack Chassis', icon: '🏢', tier: 14, level: 14 },
    { name: 'Crypto ASIC', icon: '🏗️', tier: 15, level: 15 },
    { name: 'Solar Array', icon: '☀️', tier: 16, level: 16 },
    { name: 'AI Processor', icon: '👾', tier: 17, level: 17 },
    { name: 'Quantum Core', icon: '🔮', tier: 18, level: 18 },
  ];

  const getCumulativeCost = (targetTier) => {
    let total = 0;
    // Current nodeTier (e.g., 6).
    // Booster 6 (Tier 7) upgrade loops i=6. costs index 6 ($160).
    for (let i = nodeTier; i < targetTier; i++) {
       total += parseFloat(tierCosts[i] || '0');
    }
    return total;
  };

  return (
    <div className="page page-upgrade">
      <div style={{ padding: '10px 0 20px', display: 'flex', alignItems: 'center' }}>
        <button 
          onClick={() => setActiveTab('earn')}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}
        >←</button>
        <h2 style={{ flex: 1, textAlign: 'center', fontSize: '20px', fontWeight: 900 }}>BOOSTERS</h2>
      </div>

      {/* Hero Registration Card if not registered */}
      {!nodeId && (
        <div className="partner-card" style={{ padding: '24px', background: 'var(--neon-lime)', color: '#000', marginBottom: '24px', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '20px', fontWeight: 900 }}>INITIALIZE NODE</span>
          <span style={{ fontSize: '12px', fontWeight: 700, opacity: 0.8 }}>REGISTER TO TIER 1 & UNLOCK BOOSTERS</span>
          <button 
            className="giant-btn" 
            style={{ 
              background: '#000', color: '#fff', marginTop: '12px', width: '100%',
              display: 'flex', flexDirection: 'column', height: 'auto', padding: '12px'
            }}
            onClick={handleRegister}
            disabled={isLoading}
          >
            <span style={{ fontSize: '15px' }}>REGISTER (LEVEL 1) ( {parseFloat(tierCosts[0]).toFixed(3)} BNB )</span>
            <span style={{ fontSize: '11px', opacity: 0.7 }}>≈ ${ (parseFloat(tierCosts[0]) * bnbPriceUsd).toFixed(2) } USD</span>
          </button>
        </div>
      )}

      {/* Balance Section */}
      <div className="balance-container" style={{ marginBottom: '24px' }}>
        <span className="balance-label">Current Balance</span>
        <div className="balance-main">
          <img src="/assets/gold_coin.png" className="balance-coin" alt="coin" />
          <span className="balance-value">{formatNumber(localReward)}M</span>
        </div>
      </div>

      {/* Grid Header */}
      <h3 style={{ fontSize: '13px', fontWeight: 900, color: 'var(--text-dim)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Infrastructure Levels (2-18)
      </h3>

      {/* Boosters Grid */}
      <div className="boosters-grid" style={{ 
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', 
        paddingBottom: '100px'
      }}>
        {boosters.map((b, i) => {
          const isUnlocked = nodeId && nodeTier >= b.tier;
          // Tiers higher than current are always "Open" for skipping/jumping
          const canEnable = nodeId && b.tier > nodeTier;
          const isNext = b.tier === nodeTier + 1;
          
          const cumulativeCost = getCumulativeCost(b.tier);
          const usdCost = (cumulativeCost * bnbPriceUsd).toFixed(2);

          return (
            <div key={i} className="booster-card" style={{ 
              margin: 0, 
              opacity: isUnlocked || canEnable ? 1 : 0.4,
              filter: isUnlocked || canEnable ? 'none' : 'grayscale(1)',
              transition: 'all 0.3s ease',
              padding: '16px',
              border: (isNext) ? '1px solid var(--neon-lime)' : '1px solid rgba(255,255,255,0.05)',
              background: canEnable && !isNext ? 'rgba(255,255,255,0.02)' : '',
              boxShadow: isNext ? '0 0 15px rgba(163, 255, 18, 0.1)' : 'none'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{b.icon}</div>
              <span className="booster-name" style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</span>
              <span className="booster-desc" style={{ fontSize: '10px', marginBottom: '12px', color: isNext ? 'var(--neon-lime)' : 'var(--text-dim)' }}>
                {isUnlocked ? 'COMPLETED' : `LEVEL ${b.level}`}
              </span>
              
              {isUnlocked ? (
                <div style={{ 
                  color: 'var(--neon-lime)', fontWeight: 900, fontSize: '12px', 
                  padding: '8px', background: 'rgba(163, 255, 18, 0.05)', borderRadius: '8px', textAlign: 'center'
                }}>
                  MAX
                </div>
              ) : canEnable ? (
                <button 
                  className="upgrade-btn" 
                  onClick={() => handleLevelUp(b.tier)} 
                  disabled={isLoading}
                  style={{ 
                    width: '100%', padding: '8px', fontSize: '10px',
                    borderColor: isNext ? '' : 'rgba(255,255,255,0.2)',
                    background: isNext ? '' : 'rgba(255,255,255,0.05)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', height: 'auto', gap: '2px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isNext ? 'Up' : 'Jump'} <img src="/assets/gold_coin.png" style={{ width: 10 }} alt="coin" /> {parseFloat(tierCosts[b.tier - 1] || '0').toFixed(3)}
                  </div>
                  <span style={{ fontSize: '9px', opacity: 0.6, fontWeight: 700 }}>≈ ${(parseFloat(tierCosts[b.tier - 1] || '0') * bnbPriceUsd).toFixed(2)}</span>
                </button>
              ) : (
                <div style={{ 
                  color: 'var(--text-dim)', fontWeight: 800, fontSize: '11px', 
                  padding: '8px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px'
                }}>
                  LOCKED
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
