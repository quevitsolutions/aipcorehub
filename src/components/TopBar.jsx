import { useGameStore } from '../store/gameStore.js';
import { useContract } from '../hooks/useContract.js';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useBnbPrice } from '../hooks/useBnbPrice.js';

export default function TopBar() {
  const { walletAddress, isConnected, nodeId, nodeTier, nodeActive, bnbBalance, setActiveTab, hasNode } = useGameStore();
  const { loadNodeData } = useContract();
  const bnbPrice = useBnbPrice();
  const bnbUsd = bnbPrice > 0 ? `≈ $${(parseFloat(bnbBalance || 0) * bnbPrice).toFixed(2)}` : null;

  // Calculate League Rank
  const getLeagueInfo = () => {
    if (!hasNode) {
      return { name: 'Bronze Op', class: 'league-bronze', icon: '🥉' };
    }
    const tier = Number(nodeTier || 1);
    if (tier <= 5) {
      return { name: `Silver Op · T${tier}`, class: 'league-silver', icon: '🥈' };
    }
    if (tier <= 12) {
      return { name: `Gold Op · T${tier}`, class: 'league-gold', icon: '🥇' };
    }
    return { name: `Plat Op · T${tier}`, class: 'league-platinum', icon: '💎' };
  };

  const league = getLeagueInfo();

  return (
    <div className="top-bar-fixed" style={{
      background: 'rgba(9, 14, 24, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      padding: '0 14px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: '68px', gap: 10,
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
    }}>

      {/* ─ Left: Immersive Profile Avatar ─ */}
      <div 
        onClick={() => setActiveTab('dash')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
      >
        <div style={{
          width: 36, height: 36,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: `2px solid ${hasNode ? 'var(--neon-lime)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16,
          boxShadow: hasNode ? '0 0 10px rgba(163,255,18,0.2)' : 'none'
        }}>
          {hasNode ? '⬡' : '👤'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div className={`league-badge ${league.class}`} style={{ scale: 0.9, originX: 0, padding: '3px 8px', borderRadius: 8 }}>
            <span>{league.icon}</span> {league.name}
          </div>
        </div>
      </div>

      {/* ─ Center/Right: BNB balance or status info ─ */}
      {isConnected ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div 
            onClick={() => setActiveTab('dash')}
            style={{ 
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              padding: '4px 10px', 
              borderRadius: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 900, color: '#fff' }}>{parseFloat(bnbBalance || 0).toFixed(4)}</span>
            <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--neon-lime)' }}>BNB</span>
          </div>
        </div>
      ) : null}

      {/* ─ Right: Connect/Disconnect Wallet ─ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {isConnected && (
          <button
            onClick={async (e) => {
              const icon = e.currentTarget.querySelector('span');
              if (icon) { icon.style.transition = 'transform 0.5s'; icon.style.transform = 'rotate(360deg)'; }
              const { fetchUserData } = useGameStore.getState();
              await Promise.allSettled([loadNodeData(walletAddress), fetchUserData()]);
              if (icon) setTimeout(() => { icon.style.transform = 'rotate(0deg)'; }, 500);
            }}
            style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10, width: 32, height: 32, color: '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14
            }}
          >
            <span>↻</span>
          </button>
        )}
        <div style={{ transform: 'scale(0.85)', transformOrigin: 'right center' }}>
          <ConnectButton chainStatus="none" showBalance={false}
            accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }} />
        </div>
      </div>
    </div>
  );
}

