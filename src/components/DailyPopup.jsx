import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore.js';
import { formatNumber } from '../utils/format.js';
import toast from 'react-hot-toast';

const STREAK_REWARDS = [5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];

export default function DailyPopup() {
  const { streak, setShowDailyPopup, hasNode, setActiveTab } = useGameStore();
  const currentDay = (streak % STREAK_REWARDS.length) + 1;

  const handleClaim = () => {
    toast.success(`CLAIMED DAY ${currentDay} REWARD! 🔥`);
    setShowDailyPopup(false);
    
    if (!hasNode) {
      setTimeout(() => {
        toast('Activate an AIPCore Node to earn real BNB, 10x more coins, and massive pool rewards!', {
          icon: '💎',
          duration: 6000,
          style: { border: '1px solid var(--neon-lime)' }
        });
      }, 500);
    }
  };

  return (
    <AnimatePresence>
      <div className="dialogue-glass-wrap">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="dialogue-glass-card"
        >
          {/* Header Icon */}
          <div style={{
            width: '72px', height: '72px',
            background: 'rgba(163, 255, 18, 0.1)',
            borderRadius: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px',
            marginBottom: '20px',
            border: '1px solid rgba(163, 255, 18, 0.2)'
          }}>🔥</div>

          <div className="modal-title" style={{ textAlign: 'center' }}>DAILY REWARD</div>
          <div className="modal-sub" style={{ marginBottom: '32px' }}>
            LOG IN DAILY TO GROW YOUR MINING RESERVE
          </div>
          
          {!hasNode && (
            <div style={{ background: 'rgba(255,149,0,0.1)', border: '1px solid rgba(255,149,0,0.3)', padding: '12px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#FF9500' }}>⭐ FREE OPERATIVE</span>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', marginTop: '4px', lineHeight: 1.4, fontWeight: 700 }}>
                You're on a free trial mining 10 coins/hr. <strong>Upgrade to an Active Node</strong> to earn real <strong>BNB</strong>, mine at <strong>10x speed</strong>, and unlock ecosystem rewards!
              </p>
            </div>
          )}

          {/* Streak Grid */}
          <div className="streak-grid-aipcore">
            {STREAK_REWARDS.map((reward, i) => {
              const day = i + 1;
              const isActive = day === currentDay;
              return (
                <div key={day} className={`day-box ${isActive ? 'active' : ''}`} style={{
                  background: isActive ? 'rgba(163, 255, 18, 0.1)' : 'rgba(255,255,255,0.02)',
                  borderColor: isActive ? 'var(--neon-lime)' : 'rgba(255,255,255,0.05)',
                  padding: '16px 8px'
                }}>
                  <span className="d-num" style={{ fontSize: '9px' }}>DAY {day}</span>
                  <span className="d-val" style={{ fontSize: '12px' }}>{formatNumber(reward)}</span>
                </div>
              );
            })}
          </div>

          <button 
            className="giant-btn shimmer-btn" 
            onClick={handleClaim}
            style={{ 
              background: 'var(--neon-lime)', 
              color: '#000', 
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: 900,
              padding: '18px',
              width: '100%',
              boxShadow: '0 0 20px rgba(163, 255, 18, 0.3)'
            }}
          >
            CLAIM REWARD
          </button>

          <button 
            onClick={() => setShowDailyPopup(false)}
            style={{ 
              marginTop: '16px', 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-dim)', 
              fontSize: '12px', 
              fontWeight: 800, 
              cursor: 'pointer',
              letterSpacing: '1px'
            }}
          >
            DISMISS
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
