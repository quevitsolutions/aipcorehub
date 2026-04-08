import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { formatNumber } from '../utils/format.js';
import { useContract } from '../hooks/useContract.js';

export default function EarnScreen() {
  const { 
    localReward, miningRate, energy, maxEnergy, 
    hasNode, nodeId, lastClaimTime, pendingMined,
    handleTap, claimMined, setActiveTab 
  } = useGameStore();

  const [explosion, setExplosion] = useState([]);
  const [, setTick] = useState(0);

  // Force re-render every second for timer
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  const maturity = hasNode ? Math.min(1, pendingMined / (miningRate || 1000)) : 0;
  
  // Time remaining logic
  const timeElapsed = Date.now() - lastClaimTime;
  const timeRemaining = Math.max(0, 86400000 - timeElapsed);
  const formatTime = (ms) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  const onTap = (e) => {
    const res = handleTap();
    if (res.status === 'SUCCESS' || res.status === 'DEMO') {
      const touch = e.touches ? e.touches[0] : e;
      spawnFloat(touch.clientX, touch.clientY, `+${miningRate / 1000}`);
    }
  };

  const spawnFloat = (x, y, text) => {
    const el = document.createElement('div');
    el.className = 'float-tap';
    el.innerText = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  };

  const onClaim = () => {
    if (pendingMined <= 0) return;
    
    // Trigger explosion
    const particles = Array.from({ length: 15 }).map((_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
    }));
    setExplosion(particles);
    
    setTimeout(() => {
      claimMined();
      setExplosion([]);
    }, 800);
  };

  return (
    <div className="page-earn" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      
      {/* Top Section */}
      <div style={{ flexShrink: 0, position: 'relative' }}>
        
        {/* Node Status Header */}
        <div style={{ display: 'flex', padding: '10px 0 16px', justifyContent: 'space-between', alignItems: 'center' }}>
          {hasNode ? (
            <div style={{ 
              background: 'rgba(163, 255, 18, 0.1)', color: 'var(--neon-lime)', 
              padding: '6px 14px', borderRadius: '20px',
              border: '1px solid rgba(163, 255, 18, 0.2)',
              fontSize: '12px', fontWeight: 800, letterSpacing: '0.05em'
            }}>
              ⬡ NODE #{nodeId}
            </div>
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 700 }}>REGISTER TO START MINING</div>
          )}
          <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-dim)' }}>
            {((miningRate || 0) / 1000).toFixed(1)}K / DAY
          </div>
        </div>

        {/* Balance Display */}
        <div className="balance-container" style={{ margin: '10px 0 30px' }}>
          <div className="balance-main">
            <img src="/assets/gold_coin.png" className="balance-coin" alt="coin" />
            <span className="balance-value">{formatNumber(localReward)}</span>
          </div>
        </div>
      </div>

      {/* Middle Section (Egg) */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div className="egg-hub" style={{ position: 'relative' }}>
          
          {/* Maturity Progress Ring (The "Line Round") */}
          <div style={{
            position: 'absolute', top: -2, left: -2, right: -2, bottom: -2,
            borderRadius: '50%', 
            padding: '2px',
            background: `conic-gradient(var(--neon-lime) ${maturity * 100}%, rgba(255,255,255,0.05) 0deg)`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'destination-out',
            maskComposite: 'exclude'
          }} />

          {/* Progress Bar Label (Above) */}
          <div style={{ 
            position: 'absolute', top: -45, width: '100%', textAlign: 'center',
            fontSize: '10px', fontWeight: 900, color: 'var(--neon-lime)', letterSpacing: '0.1em'
          }}>
            {maturity >= 1 ? 'READY TO HATCH' : `MATURING: ${Math.floor(maturity * 100)}%`}
          </div>

          <div style={{ position: 'relative', width: '240px', height: '240px' }}>
            <img 
              src="/assets/egg_orange.png" 
              className={`egg-main ${maturity >= 1 ? 'egg-glow' : ''}`}
              alt="Mining Egg"
              onClick={onTap}
              onTouchStart={onTap}
              style={{
                borderRadius: '50%',
                clipPath: 'circle()',
                objectFit: 'cover',
                width: '100%',
                height: '100%',
                margin: 0,
                filter: `drop-shadow(0 0 ${20 * maturity}px rgba(203, 255, 1, 0.3))`,
                transform: `scale(${0.95 + 0.1 * maturity})`,
                transition: 'transform 0.3s ease, filter 0.3s ease',
                background: 'var(--bg-dark)'
              }}
            />

            {/* Cracks Overlay */}
            {maturity > 0.1 && (
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                opacity: maturity,
                borderRadius: '50%',
                clipPath: 'circle()',
                backgroundSize: 'cover',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cpath d=\'M20 20 L40 40 M60 20 L80 50 M30 70 L50 80 M70 80 L90 60\' stroke=\'black\' stroke-width=\'2\' opacity=\'0.8\'/%3E%3C/svg%3E")',
                mixBlendMode: 'multiply'
              }} />
            )}

            {/* Explosion Particles */}
            {explosion.map(p => (
              <img 
                key={p.id}
                src="/assets/gold_coin.png"
                style={{
                  position: 'absolute', width: 24, left: '50%', top: '50%',
                  transform: `translate(${p.x}px, ${p.y}px)`,
                  animation: 'explode 0.8s ease-out forwards'
                }}
                alt="coin"
              />
            ))}
          </div>
          
          {/* Boost Pill */}
          <div className="boost-pill" onClick={() => setActiveTab('mine')} style={{ cursor: 'pointer', zIndex: 10 }}>
            <span>Boost</span>
            <div className="up-icon">⬆</div>
          </div>
        </div>
      </div>

      {/* Fixed Claim Button Module */}
      <div className="claim-container" style={{ 
        flexDirection: 'column', 
        alignItems: 'center',
        background: 'linear-gradient(to top, var(--bg-dark), transparent)', 
        padding: '20px 24px 40px' 
      }}>
        <div style={{ width: '100%', maxWidth: '468px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)' }}>MINING SESSION</span>
          <span style={{ fontSize: '11px', fontWeight: 900, color: '#fff' }}>{formatTime(timeRemaining)}</span>
        </div>
        
        <button 
          className="giant-btn" 
          onClick={onClaim}
          disabled={pendingMined <= 0}
          style={{ opacity: pendingMined <= 0 ? 0.5 : 1 }}
        >
          <div className="flex-column" style={{ alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: '18px', fontWeight: 900 }}>{maturity >= 1 ? 'HATCH & CLAIM' : 'CLAIM MINED'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <img src="/assets/gold_coin.png" style={{ width: 14 }} alt="coin" />
              <span style={{ fontSize: '16px', fontWeight: 900 }}>{formatNumber(pendingMined)}</span>
            </div>
          </div>
        </button>
      </div>

      <style>{`
        @keyframes explode {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
