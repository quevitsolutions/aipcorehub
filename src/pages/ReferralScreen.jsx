import { useGameStore } from '../store/gameStore.js';
import { formatNumber, getRefLink, getWebAppRefLink, shortAddr } from '../utils/format.js';
import toast from 'react-hot-toast';

export default function ReferralScreen() {
  const { walletAddress, nodeId, directRefs, localReward } = useGameStore();

  const userId = nodeId || walletAddress?.slice(-6) || '000000';
  const refLink = getRefLink(userId);
  const webAppRefLink = getWebAppRefLink(userId);

  const copyLink = (link) => {
    navigator.clipboard.writeText(link).then(() => {
      toast.success('LINK COPIED! 🔗', {
        style: {
          background: '#1A1F26',
          color: '#A3FF12',
          border: '1px solid rgba(163, 255, 18, 0.2)'
        }
      });
    }).catch(() => {
      toast.error('COPY FAILED');
    });
  };

  const inviteLink = walletAddress ? `https://aipcore.online/?ref=${walletAddress}` : 'Connect wallet to get link';
  
  const handleShare = () => {
    if (!walletAddress) {
      toast.error("Please connect wallet first");
      return;
    }
    navigator.clipboard.writeText(inviteLink);
    toast.success("Referral link copied!");
  };

  const topReferrers = [
    { rank: 1, name: 'WhaleMaster', count: 1240, reward: '15.4M' },
    { rank: 2, name: 'CryptoKnight', count: 856, reward: '10.2M' },
    { rank: 3, name: 'NodeRunner', count: 720, reward: '8.1M' },
  ];

  return (
    <div className="page page-referral">
      <div style={{ textAlign: 'center', padding: '10px 0 30px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px' }}>INVITE FRIENDS</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.05em' }}>
          GROW THE NETWORK & EARN BONUSES
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
        <div className="booster-card" style={{ margin: 0, padding: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--neon-lime)' }}>{directRefs}</span>
          <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 800, marginTop: '4px' }}>TOTAL FRIENDS</span>
        </div>
        <div className="booster-card" style={{ margin: 0, padding: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--neon-lime)' }}>{formatNumber(localReward)}M</span>
          <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 800, marginTop: '4px' }}>REWARDS EARNED</span>
        </div>
      </div>

      {/* Bonus Section */}
      <h3 style={{ fontSize: '13px', fontWeight: 900, color: 'var(--text-dim)', marginBottom: '16px', paddingLeft: '4px' }}>LIST OF BONUSES</h3>
      
      <div className="partner-card" style={{ gap: 16, padding: '20px', marginBottom: '12px', background: 'linear-gradient(90deg, #1B2A4A, #05080F)' }}>
        <div style={{ fontSize: '32px' }}>🎁</div>
        <div className="flex-column" style={{ flex: 1 }}>
          <span style={{ fontSize: '15px', fontWeight: 800 }}>Basic Invite</span>
          <span style={{ fontSize: '12px', color: 'var(--neon-lime)', fontWeight: 700 }}>+5,000 for you and friend</span>
        </div>
        <span style={{ fontSize: '12px', opacity: 0.3 }}>〉</span>
      </div>

      <div className="partner-card" style={{ gap: 16, padding: '20px', marginBottom: '32px', background: 'linear-gradient(90deg, #1B2A4A, #05080F)' }}>
        <div style={{ fontSize: '32px' }}>💎</div>
        <div className="flex-column" style={{ flex: 1 }}>
          <span style={{ fontSize: '15px', fontWeight: 800 }}>Telegram Premium</span>
          <span style={{ fontSize: '12px', color: 'var(--neon-lime)', fontWeight: 700 }}>+25,000 for you and friend</span>
        </div>
        <span style={{ fontSize: '12px', opacity: 0.3 }}>〉</span>
      </div>

      {/* Top Referrers Leaderboard */}
      <h3 style={{ fontSize: '13px', fontWeight: 900, color: 'var(--text-dim)', marginBottom: '16px', paddingLeft: '4px' }}>TOP REFERRERS</h3>
      <div className="booster-card" style={{ padding: '8px 16px', marginBottom: '40px' }}>
        {topReferrers.map((ref, i) => (
          <div key={i} style={{ 
            display: 'flex', alignItems: 'center', padding: '12px 0',
            borderBottom: i < topReferrers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
          }}>
            <span style={{ width: '24px', fontSize: '13px', fontWeight: 900, color: i === 0 ? '#FFD700' : '#fff' }}>#{ref.rank}</span>
            <div className="flex-column" style={{ flex: 1, marginLeft: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800 }}>{ref.name}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{ref.count} referrals</span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--neon-lime)' }}>{ref.reward}</span>
          </div>
        ))}
        <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 700, cursor: 'pointer' }}>VIEW FULL RANKING 〉</span>
        </div>
      </div>

      {/* Referral Link & Share Container */}
      <div style={{ padding: '20px 0', background: 'transparent' }}>
        
        <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', marginBottom: '8px' }}>STANDARD BOT LINK</h4>
        <div style={{ 
          display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', 
          borderRadius: '16px', padding: '12px 16px', marginBottom: '16px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--text-dim)', fontWeight: 600, userSelect: 'all' }}>
            {refLink}
          </div>
          <button 
            onClick={() => copyLink(refLink)}
            style={{ 
              background: 'none', border: 'none', color: 'var(--neon-lime)', 
              fontSize: '18px', cursor: 'pointer', paddingLeft: '16px', marginLeft: '8px',
              borderLeft: '1px solid rgba(255,255,255,0.1)'
            }}
            title="Copy Bot Link"
          >
            📋
          </button>
        </div>

        <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', marginBottom: '8px' }}>DIRECT WEBAPP LINK</h4>
        <div style={{ 
          display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', 
          borderRadius: '16px', padding: '12px 16px', marginBottom: '16px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--text-dim)', fontWeight: 600, userSelect: 'all' }}>
            {webAppRefLink}
          </div>
          <button 
            onClick={() => copyLink(webAppRefLink)}
            style={{ 
              background: 'none', border: 'none', color: 'var(--neon-lime)', 
              fontSize: '18px', cursor: 'pointer', paddingLeft: '16px', marginLeft: '8px',
              borderLeft: '1px solid rgba(255,255,255,0.1)'
            }}
            title="Copy WebApp Link"
          >
            📋
          </button>
        </div>

        <button className="giant-btn" onClick={() => {
          const text = "🚀 Join my AIPCore Network and let's earn BNB together!";
          const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(webAppRefLink)}&text=${encodeURIComponent(text)}`;
          window.open(tgUrl, '_blank');
        }}>
          SHARE DIRECT APP TO TELEGRAM
        </button>
      </div>
    </div>
  );
}
