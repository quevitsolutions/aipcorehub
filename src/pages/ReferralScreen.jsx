import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { formatNumber, shortAddr } from '../utils/format.js';
import toast from 'react-hot-toast';

export default function ReferralScreen() {
  const { 
    walletAddress, 
    directRefs, 
    localReward, 
    leaderboard, 
    referralList, 
    fetchLeaderboardData, 
    fetchReferralData 
  } = useGameStore();

  useEffect(() => {
    fetchLeaderboardData();
    if (walletAddress) fetchReferralData();
  }, [walletAddress, fetchLeaderboardData, fetchReferralData]);

  const inviteLink = walletAddress ? `${window.location.origin}/?ref=${walletAddress}` : 'Connect wallet to get link';
  
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

  const handleShare = () => {
    if (!walletAddress) {
      toast.error("Please connect wallet first");
      return;
    }
    copyLink(inviteLink);
  };

  return (
    <div className="page page-referral" style={{ paddingBottom: '120px' }}>
      <div style={{ textAlign: 'center', padding: '10px 0 30px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px' }}>INVITE FRIENDS</h2>
        <p style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Grow your pod and earn massive bonuses
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
        <div className="booster-card" style={{ margin: 0, padding: '16px', alignItems: 'center', border: '1px solid rgba(163, 255, 18, 0.1)' }}>
          <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--neon-lime)' }}>{directRefs}</span>
          <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 800, marginTop: '4px' }}>TOTAL FRIENDS</span>
        </div>
        <div className="booster-card" style={{ margin: 0, padding: '16px', alignItems: 'center', border: '1px solid rgba(163, 255, 18, 0.1)' }}>
          <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--neon-lime)' }}>{(localReward / 1000000).toFixed(1)}M</span>
          <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 800, marginTop: '4px' }}>EST. REWARDS</span>
        </div>
      </div>

      {/* Referral Link Container */}
      <div className="booster-card" style={{ padding: '20px', marginBottom: '32px', border: '1px solid rgba(163, 255, 18, 0.05)' }}>
        <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', marginBottom: '12px', letterSpacing: '1px' }}>YOUR REFERRAL LINK</h4>
        <div style={{ 
          display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', 
          borderRadius: '12px', padding: '12px 14px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', color: '#fff', fontWeight: 600, opacity: 0.8 }}>
            {inviteLink}
          </div>
          <button 
            onClick={() => copyLink(inviteLink)}
            style={{ 
              background: 'none', border: 'none', color: 'var(--neon-lime)', 
              fontSize: '16px', cursor: 'pointer', marginLeft: '12px'
            }}
          >
            📋
          </button>
        </div>
        <button className="shimmer-btn" style={{ 
          width: '100%', marginTop: '16px', background: 'var(--neon-lime)', color: '#000',
          fontWeight: 900, padding: '14px', borderRadius: '12px', border: 'none', fontSize: '14px'
        }} onClick={handleShare}>
          SEND INVITE
        </button>
      </div>

      {/* My Recent Invites */}
      <h3 style={{ fontSize: '12px', fontWeight: 900, color: 'var(--text-dim)', marginBottom: '12px', letterSpacing: '1px' }}>MY RECENT INVITES</h3>
      <div className="booster-card" style={{ padding: '8px 16px', marginBottom: '32px' }}>
        {referralList.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', fontSize: '11px', opacity: 0.5 }}>No friends invited yet. Start sharing your link!</div>
        ) : (
          referralList.slice(0, 5).map((friend, i) => (
            <div key={i} style={{ 
              display: 'flex', alignItems: 'center', padding: '12px 0',
              borderBottom: i < referralList.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
            }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(163, 255, 18, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>👤</div>
              <div className="flex-column" style={{ flex: 1, marginLeft: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800 }}>{shortAddr(friend.wallet_address)}</span>
                <span style={{ fontSize: '10px', color: 'var(--neon-lime)', fontWeight: 700 }}>Active Miner</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 900 }}>{(friend.local_reward / 1000).toFixed(1)}K</span>
            </div>
          ))
        )}
      </div>

      {/* Top Referrers Leaderboard */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 900, color: 'var(--text-dim)', letterSpacing: '1px' }}>GLOBAL LEADERBOARD</h3>
        <span style={{ fontSize: '10px', color: 'var(--neon-lime)', fontWeight: 800 }}>LIVE STATS</span>
      </div>
      
      <div className="booster-card" style={{ padding: '8px 16px' }}>
        {leaderboard.slice(0, 10).map((u, i) => (
          <div key={i} style={{ 
            display: 'flex', alignItems: 'center', padding: '12px 0',
            borderBottom: i < 9 && i < leaderboard.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
          }}>
            <span style={{ width: '24px', fontSize: '13px', fontWeight: 900, color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--text-dim)' }}>#{i + 1}</span>
            <div className="flex-column" style={{ flex: 1, marginLeft: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: u.wallet_address === walletAddress ? 'var(--neon-lime)' : '#fff' }}>
                {shortAddr(u.wallet_address)} {u.wallet_address === walletAddress && '(YOU)'}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{formatNumber(u.taps)} total taps</span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--neon-lime)' }}>{(u.local_reward / 1000000).toFixed(2)}M</span>
          </div>
        ))}
        {leaderboard.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', fontSize: '11px', opacity: 0.5 }}>Syncing global rankings...</div>
        )}
      </div>
    </div>
  );
}
