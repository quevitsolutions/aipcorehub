import { useGameStore } from '../store/gameStore.js';
import { formatNumber } from '../utils/format.js';
import toast from 'react-hot-toast';

const STREAK_REWARDS = [5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];

export default function DailyPopup() {
  const { streak, setShowDailyPopup } = useGameStore();

  const currentDay = (streak % STREAK_REWARDS.length) + 1;

  const handleClaim = () => {
    toast.success(`CLAIMED DAY ${currentDay} REWARD! 🔥`);
    setShowDailyPopup(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-sheet">
        <div className="modal-pill" />
        
        {/* Flame Icon */}
        <img src="/assets/flame.png" className="flame-icon egg-glow" alt="Streak Flame" />

        <div className="modal-title">DAILY REWARD</div>
        <div className="modal-sub">
          ACCUMULATE COINS FOR DAILY LOGINS WITHOUT SKIPPING
        </div>

        {/* Streak Grid */}
        <div className="streak-grid-aipcore">
          {STREAK_REWARDS.map((reward, i) => {
            const day = i + 1;
            const isActive = day === currentDay;
            return (
              <div key={day} className={`day-box ${isActive ? 'active' : ''}`}>
                <span className="d-num">Day {day}</span>
                <span className="d-val">{formatNumber(reward)}</span>
              </div>
            );
          })}
        </div>

        {/* Claim Button */}
        <button 
          className="giant-btn" 
          id="claim-daily-aipcore-btn" 
          onClick={handleClaim}
          style={{ 
            background: 'var(--neon-lime)', 
            color: '#000', 
            borderRadius: '24px',
            fontSize: '18px',
            fontWeight: 800,
            padding: '16px'
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
            fontWeight: 700, 
            cursor: 'pointer' 
          }}
        >
          NOT NOW
        </button>
      </div>
    </div>
  );
}
