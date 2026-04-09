import { useGameStore } from '../store/gameStore.js';
import { useContract } from '../hooks/useContract.js';

export default function TopBar() {
  const { walletAddress, isConnected } = useGameStore();
  const { loadNodeData } = useContract();

  return (
    <div className="top-bar-fixed" style={{ 
      position: 'fixed',
      top: 0, left: 0, right: 0,
      background: 'rgba(5, 8, 15, 0.85)', 
      backdropFilter: 'blur(15px)',
      WebkitBackdropFilter: 'blur(15px)',
      borderBottom: '1px solid rgba(163, 255, 18, 0.1)',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 1100,
      height: '64px'
    }}>
      {/* Branding Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ 
          width: '32px', height: '32px', 
          background: 'var(--neon-lime)', 
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', color: '#000', fontWeight: 900,
          boxShadow: '0 0 15px rgba(163, 255, 18, 0.3)'
        }}>A</div>
        <div style={{ 
          color: '#fff', 
          fontSize: '18px', 
          fontWeight: 900,
          letterSpacing: '-0.02em'
        }}>
          AIPCORE <span style={{ fontSize: '10px', opacity: 0.5, color: 'var(--neon-lime)' }}>PRO</span>
        </div>
      </div>

      {/* Wallet Actions Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {isConnected && (
          <button 
            onClick={async (e) => {
              const icon = e.currentTarget.querySelector('span');
              if (icon) icon.style.transform = 'rotate(360deg)';
              const { fetchUserData } = useGameStore.getState();
              await Promise.allSettled([
                loadNodeData(walletAddress),
                fetchUserData()
              ]);
              if (icon) setTimeout(() => icon.style.transform = 'rotate(0deg)', 500);
            }}
            className="shimmer-btn"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '10px',
              width: '36px', height: '36px',
              color: '#fff', 
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <span style={{ transition: 'transform 0.5s ease' }}>↻</span>
          </button>
        )}

        {/* Official SDK Connection Bridge */}
        <div style={{ transform: 'scale(0.9)', transformOrigin: 'right center' }}>
          <appkit-button balance="hide" />
        </div>
      </div>
    </div>
  );
}
