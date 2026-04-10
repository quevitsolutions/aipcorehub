import { useGameStore } from '../store/gameStore.js';
import { useContract } from '../hooks/useContract.js';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function TopBar() {
  const { walletAddress, isConnected, nodeId, nodeTier } = useGameStore();
  const { loadNodeData } = useContract();

  return (
    <div className="top-bar-fixed" style={{
      background: 'rgba(5, 8, 15, 0.92)',
      backdropFilter: 'blur(15px)',
      WebkitBackdropFilter: 'blur(15px)',
      borderBottom: '1px solid rgba(163, 255, 18, 0.1)',
      padding: '0 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: '64px', gap: 8
    }}>

      {/* ─ Branding Left (Hidden on Desktop) ─ */}
      <div className="mobile-only" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, background: 'var(--neon-lime)',
          borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, color: '#000', fontWeight: 900,
          boxShadow: '0 0 15px rgba(163,255,18,0.3)'
        }}>A</div>
        <div style={{ color: '#fff', fontSize: 17, fontWeight: 900, letterSpacing: '-0.02em' }}>
          AIPCORE <span style={{ fontSize: 9, opacity: 0.5, color: 'var(--neon-lime)' }}>PRO</span>
        </div>
      </div>

      {/* ─ Node ID + Tier pill (center) ─ */}
      {isConnected && nodeId ? (
        <div style={{
          flex: 1, display: 'flex', justifyContent: 'center',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(203,255,1,0.07)',
            border: '1px solid rgba(203,255,1,0.2)',
            borderRadius: 40, padding: '5px 14px',
          }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--neon-lime)', letterSpacing: 0.5 }}>
              ⬡ NODE #{nodeId}
            </span>
            <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.15)' }} />
            <span style={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>
              TIER {nodeTier || 1}
            </span>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1 }} />
      )}

      {/* ─ Right: Refresh + Wallet ─ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
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
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, width: 34, height: 34, color: '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16
            }}
          >
            <span>↻</span>
          </button>
        )}
        <div style={{ transform: 'scale(0.87)', transformOrigin: 'right center' }}>
          <ConnectButton chainStatus="none" showBalance={false}
            accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }} />
        </div>
      </div>
    </div>
  );
}
