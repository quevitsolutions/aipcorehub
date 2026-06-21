import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore.js';
import { useContract } from '../hooks/useContract.js';
import toast from 'react-hot-toast';

export default function NodePopup() {
  const { setShowNodePopup, referrerId, sponsorNodeId, sponsorWallet, isWeb3Connected } = useGameStore();
  const { createNode, connectWallet } = useContract();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!isWeb3Connected) {
      await connectWallet();
      return;
    }
    setLoading(true);

    // BUG FIX: referrerId is a wallet address string — parseInt("0x...") returns wrong hex values.
    // Use sponsorNodeId (resolved numeric node ID from backend) as the authoritative sponsor.
    // Fallback chain: resolved node ID -> genesis (36999)
    const effectiveSponsor = (sponsorNodeId && Number(sponsorNodeId) > 0)
      ? Number(sponsorNodeId)
      : 36999;

    const ok = await createNode(effectiveSponsor);
    setLoading(false);
    if (ok) setShowNodePopup(false);
  };

  return (
    <AnimatePresence>
      <div className="dialogue-glass-wrap" onClick={(e) => { if (e.target === e.currentTarget) setShowNodePopup(false); }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="dialogue-glass-card"
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ 
              width: '80px', height: '80px', 
              background: 'rgba(163, 255, 18, 0.1)', 
              borderRadius: '24px', 
              margin: '0 auto 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '40px',
              color: 'var(--neon-lime)',
              border: '1px solid rgba(163, 255, 18, 0.2)',
              boxShadow: '0 0 30px rgba(163, 255, 18, 0.1)'
            }}>⬡</div>
            <div className="modal-title">ACTIVATE NODE</div>
            <div className="modal-sub">
              JOIN THE ELITE MINERS AND UNLOCK PROTOCOL REWARDS
            </div>
          </div>

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
                <span style={{ fontSize: '10px', fontWeight: 900, color: '#FFB74D' }}>{item.text}</span>
              </div>
            ))}
          </div>

          {(sponsorWallet || referrerId) && (
            <div style={{ 
              textAlign: 'center', 
              fontSize: '11px', 
              fontWeight: 800, 
              color: 'var(--neon-lime)',
              marginBottom: '20px',
              background: 'rgba(163, 255, 18, 0.1)',
              padding: '8px 16px',
              borderRadius: '40px'
            }}>
              🔗 SPONSOR: {sponsorNodeId ? `#${sponsorNodeId}` : sponsorWallet ? `${sponsorWallet.slice(0,8)}...` : `#${referrerId}`}
            </div>
          )}

          <button 
            className="giant-btn shimmer-btn" 
            onClick={handleCreate}
            disabled={loading}
            style={{ 
              width: '100%',
              background: 'var(--neon-lime)', 
              color: '#000', 
              padding: '18px',
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: 900,
              boxShadow: '0 0 20px rgba(163, 255, 18, 0.3)'
            }}
          >
            {loading ? 'PROCESSING...' : isWeb3Connected ? 'ACTIVATE NOW' : 'CONNECT WALLET'}
          </button>

          <button 
            onClick={() => setShowNodePopup(false)}
            style={{ 
              marginTop: '16px', 
              background: 'none', 
              border: 'none', 
              color: '#FFD700', 
              fontSize: '12px', 
              fontWeight: 800, 
              cursor: 'pointer',
              letterSpacing: '1px'
            }}
          >
            NOT INTERESTED
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
