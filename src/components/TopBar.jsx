import { useGameStore } from '../store/gameStore.js';
import { useContract } from '../hooks/useContract.js';
import { shortAddr } from '../utils/format.js';

export default function TopBar({ onConnect, onDisconnect }) {
  const { walletAddress, isConnected, bnbBalance, hasNode, nodeTier } = useGameStore();
  const { loadNodeData } = useContract();

  return (
    <div className="top-bar" style={{ 
      background: 'rgba(10, 17, 31, 0.9)', 
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      padding: '16px'
    }}>
      <div className="logo" style={{ 
        color: 'var(--lime)', 
        fontSize: '22px', 
        fontWeight: 900,
        letterSpacing: '-0.02em',
        background: 'none'
      }}>
        AIPCORE <span style={{ fontSize: '10px', opacity: 0.5, fontWeight: 700 }}>v2.0</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button 
          onClick={async (e) => {
            e.currentTarget.style.transform = 'rotate(360deg)';
            e.currentTarget.style.transition = 'transform 0.5s ease-in-out';
            const { fetchUserData } = useGameStore.getState();
            await Promise.allSettled([
              loadNodeData(walletAddress),
              fetchUserData()
            ]);
            setTimeout(() => e.currentTarget.style.transform = 'rotate(0deg)', 500);
          }}
          disabled={!isConnected}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: 'none', borderRadius: '50%',
            width: '32px', height: '32px',
            color: isConnected ? '#fff' : '#444', 
            cursor: isConnected ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          ↻
        </button>
        {isConnected && (
          <div style={{ 
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '12px',
            fontWeight: 800
          }}>
            <span style={{ color: 'var(--lime)' }}>{bnbBalance}</span>
            <span style={{ opacity: 0.5 }}>BNB</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            className="wallet-btn"
            onClick={isConnected ? null : onConnect}
            style={{ 
              background: isConnected ? 'rgba(163, 255, 18, 0.1)' : 'rgba(255,255,255,0.05)',
              color: isConnected ? 'var(--lime)' : '#FFFFFF',
              border: isConnected ? '1px solid rgba(163, 255, 18, 0.2)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '8px 16px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: isConnected ? 'default' : 'pointer'
            }}
          >
            {isConnected ? shortAddr(walletAddress) : 'CONNECT'}
          </button>

          {isConnected && (
            <button 
              onClick={onDisconnect}
              style={{
                background: 'rgba(255, 59, 48, 0.1)',
                border: '1px solid rgba(255, 59, 48, 0.2)',
                borderRadius: '10px',
                padding: '8px',
                color: '#FF3B30',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Disconnect Wallet"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
