import { useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { useContract } from '../hooks/useContract.js';
import toast from 'react-hot-toast';

export default function NodePopup() {
  const { setShowNodePopup, referrerId, isConnected } = useGameStore();
  const { createNode, connectWallet } = useContract();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }
    setLoading(true);
    const sponsorId = referrerId ? parseInt(referrerId) : 36999;
    const ok = await createNode(sponsorId);
    setLoading(false);
    if (ok) setShowNodePopup(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowNodePopup(false); }}>
      <div className="modal-sheet">
        <div className="modal-pill" />

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ 
            width: '80px', height: '80px', 
            background: 'var(--neon-lime)', 
            borderRadius: '24px', 
            margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '40px',
            color: '#000',
            boxShadow: '0 0 30px rgba(203, 255, 1, 0.3)'
          }}>⬡</div>
          <div className="modal-title">ACTIVATE NODE</div>
          <div className="modal-sub">
            UNLOCK THE FULL POTENTIAL OF THE AIPCORE ECOSYSTEM
          </div>
        </div>

        {/* Benefits Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '32px', width: '100%' }}>
          {[
            { icon: '💰', text: 'EARN BNB' },
            { icon: '👥', text: 'REF BONUSES' },
            { icon: '🏊', text: 'POOL ACCESS' },
            { icon: '🚀', text: 'LEVEL 18' },
          ].map((item, i) => (
            <div key={i} style={{ 
              background: 'rgba(255,255,255,0.03)', 
              padding: '16px 12px', 
              borderRadius: '16px',
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              gap: '8px',
              border: '1px solid rgba(255,255,255,0.05)',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '24px' }}>{item.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-dim)' }}>{item.text}</span>
            </div>
          ))}
        </div>

        {referrerId && (
          <div style={{ 
            textAlign: 'center', 
            fontSize: '11px', 
            fontWeight: 800, 
            color: 'var(--neon-lime)',
            marginBottom: '20px',
            background: 'rgba(203, 255, 1, 0.1)',
            padding: '8px 16px',
            borderRadius: '40px'
          }}>
            🔗 SPONSOR: #{referrerId}
          </div>
        )}

        {/* Action Button */}
        <button 
          className="giant-btn" 
          id="activate-node-confirm-btn" 
          onClick={handleCreate}
          disabled={loading}
          style={{ 
            width: '100%',
            background: 'var(--neon-lime)', 
            color: '#000', 
            padding: '20px',
            borderRadius: '20px',
            fontSize: '18px',
            fontWeight: 900
          }}
        >
          {loading ? 'PROCESSING...' : isConnected ? 'ACTIVATE NOW' : 'CONNECT WALLET'}
        </button>

        <button 
          onClick={() => setShowNodePopup(false)}
          style={{ 
            marginTop: '16px', 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-dim)', 
            fontSize: '12px', 
            fontWeight: 700, 
            cursor: 'pointer' 
          }}
        >
          MAYBE LATER
        </button>
      </div>
    </div>
  );
}
