import { useEffect, useState } from 'react';
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
    fetchReferralData,
    sponsorWallet,
    hasNode,
  } = useGameStore();

  const [inviteTab, setInviteTab] = useState('activated');

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
      <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px' }}>INVITE FRIENDS</h2>
        <p style={{ fontSize: '11px', color: '#FFFFFF', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Grow your pod and earn massive bonuses
        </p>
      </div>

      {/* ── Referred By Card ─────────────────────────────── */}
      {sponsorWallet && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'linear-gradient(135deg, rgba(79,195,247,0.1), rgba(5,8,15,0))',
          border: '1px solid rgba(79,195,247,0.3)',
          borderRadius: 16, padding: '14px 16px', marginBottom: 20
        }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(79,195,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🔗</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#FFB74D', letterSpacing: 1 }}>REFERRED BY</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#4FC3F7', marginTop: 2 }}>{shortAddr(sponsorWallet)}</div>
          </div>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(79,195,247,0.6)', background: 'rgba(79,195,247,0.08)', padding: '4px 8px', borderRadius: 8 }}>SPONSOR</div>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <div className="booster-card" style={{ margin: 0, padding: '16px', alignItems: 'center', border: '1px solid rgba(163, 255, 18, 0.15)', background: 'rgba(203,255,1,0.04)' }}>
          <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--neon-lime)' }}>{directRefs}</span>
          <span style={{ fontSize: '10px', color: '#FFB74D', fontWeight: 800, marginTop: '4px' }}>FRIENDS INVITED</span>
          <span style={{ fontSize: '9px', color: '#FFD700', fontWeight: 700, marginTop: 2 }}>{hasNode ? 'Activated Node' : 'Free User'}</span>
        </div>
        <div className="booster-card" style={{ margin: 0, padding: '16px', alignItems: 'center', border: '1px solid rgba(163, 255, 18, 0.1)' }}>
          <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--neon-lime)' }}>{(localReward / 1000000).toFixed(1)}M</span>
          <span style={{ fontSize: '10px', color: '#FFD700', fontWeight: 800, marginTop: '4px' }}>EST. REWARDS</span>
        </div>
      </div>

      {/* Referral Link Container */}
      <div className="booster-card" style={{ padding: '20px', marginBottom: '32px', border: '1px solid rgba(163, 255, 18, 0.05)' }}>
        <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#A3FF12', marginBottom: '12px', letterSpacing: '1px' }}>YOUR REFERRAL LINK</h4>
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
            style={{ background: 'none', border: 'none', color: 'var(--neon-lime)', fontSize: '16px', cursor: 'pointer', marginLeft: '12px' }}>
            📋
          </button>
        </div>

        {/* ─ Social Share Buttons ─ */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.45)', letterSpacing: 2, marginBottom: 10 }}>
            SHARE ON SOCIAL MEDIA
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* WhatsApp */}
            <button onClick={() => {
              const msg = encodeURIComponent(`🔥 I'm mining $AIP tokens on AIPCore — earn 200 coins/hr with 18-level matrix income!\n\n🔗 Join with my link: ${inviteLink}\n\n⬡ One-time activation | 70% matrix | 10% referral | 5% Global Pool`);
              window.open(`https://wa.me/?text=${msg}`, '_blank');
            }} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', borderRadius: 14, padding: '12px 16px', cursor: 'pointer', width: '100%' }}>
              <span style={{ fontSize: 22 }}>💬</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#25D366' }}>Share on WhatsApp</div>
                <div style={{ fontSize: 10, color: '#A3FF12', fontWeight: 700 }}>Send referral invite to contacts</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 14, color: '#25D366' }}>→</span>
            </button>

            {/* Telegram */}
            <button onClick={() => {
              const msg = encodeURIComponent(`🚀 Join me on AIPCore — mine $AIP 24/7 with binary matrix rewards!\n\nEarn from 4 income streams:\n💰 10% Referral\n🔷 70% Matrix\n⬡ 15% Level Income\n🏊 5% Global Pool\n\nActivate your node 👇\n${inviteLink}`);
              window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${msg}`, '_blank');
            }} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(42,171,238,0.1)', border: '1px solid rgba(42,171,238,0.3)', borderRadius: 14, padding: '12px 16px', cursor: 'pointer', width: '100%' }}>
              <span style={{ fontSize: 22 }}>✈️</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#2AABEE' }}>Share on Telegram</div>
                <div style={{ fontSize: 10, color: '#4FC3F7', fontWeight: 700 }}>Reach your Telegram community</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 14, color: '#2AABEE' }}>→</span>
            </button>

            {/* Twitter/X */}
            <button onClick={() => {
              const tweet = encodeURIComponent(`⬡ Just activated my Mining Node on @AIPCore!\n\nEarning $AIP tokens 24/7 with:\n✅ 70% Binary Matrix\n✅ 10% Referral Income\n✅ 15% Level Income\n✅ 5% Global Pool\n\n🚀 Join under my node 👇\n${inviteLink}\n\n#AIPCore #Crypto #BSC #DeFi #Mining`);
              window.open(`https://twitter.com/intent/tweet?text=${tweet}`, '_blank');
            }} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, padding: '12px 16px', cursor: 'pointer', width: '100%' }}>
              <span style={{ fontSize: 22 }}>𝕏</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>Share on X / Twitter</div>
                <div style={{ fontSize: 10, color: '#FF5252', fontWeight: 700 }}>Tweet with crypto hashtags</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 14, color: '#fff' }}>→</span>
            </button>

          </div>
        </div>
      </div>

      {/* My Recent Invites */}
      <h3 style={{ fontSize: '12px', fontWeight: 900, color: '#4FC3F7', marginBottom: '12px', letterSpacing: '1px' }}>MY RECENT INVITES</h3>
      
      {/* Referral Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button onClick={() => setInviteTab('activated')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: inviteTab === 'activated' ? '1px solid var(--neon-lime)' : '1px solid rgba(255,255,255,0.1)', background: inviteTab === 'activated' ? 'rgba(163,255,18,0.1)' : 'transparent', color: inviteTab === 'activated' ? 'var(--neon-lime)' : '#FFFFFF', fontWeight: 800, fontSize: '11px', cursor: 'pointer' }}>
          ACTIVATED NODES
        </button>
        <button onClick={() => setInviteTab('free')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: inviteTab === 'free' ? '1px solid #4FC3F7' : '1px solid rgba(255,255,255,0.1)', background: inviteTab === 'free' ? 'rgba(79,195,247,0.1)' : 'transparent', color: inviteTab === 'free' ? '#4FC3F7' : '#FFFFFF', fontWeight: 800, fontSize: '11px', cursor: 'pointer' }}>
          FREE MEMBERS
        </button>
      </div>

      <div className="booster-card" style={{ padding: '8px 16px', marginBottom: '32px' }}>
        {(() => {
          const filteredList = referralList.filter(f => inviteTab === 'activated' ? Number(f.node_tier) > 0 : Number(f.node_tier) === 0);
          
          if (filteredList.length === 0) {
            return (
              <div style={{ padding: '20px', textAlign: 'center', fontSize: '11px', opacity: 0.5, color: '#FFF' }}>
                No {inviteTab === 'activated' ? 'activated nodes' : 'free members'} found.
              </div>
            );
          }

          return filteredList.slice(0, 10).map((friend, i) => (
            <div key={i} style={{ 
              display: 'flex', alignItems: 'center', padding: '12px 0',
              borderBottom: i < filteredList.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
            }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: Number(friend.node_tier) > 0 ? 'rgba(203,255,1,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                {Number(friend.node_tier) > 0 ? '⬡' : '👤'}
              </div>
              <div className="flex-column" style={{ flex: 1, marginLeft: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800 }}>{shortAddr(friend.wallet_address)}</span>
                <span style={{ fontSize: '10px', color: Number(friend.node_tier) > 0 ? 'var(--neon-lime)' : '#4FC3F7', fontWeight: 700 }}>
                  {Number(friend.node_tier) > 0 ? `✅ Node Active (T${friend.node_tier})` : '🔵 Free Member'}
                </span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 900, color: Number(friend.node_tier) > 0 ? 'var(--neon-lime)' : '#FFFFFF' }}>{(friend.local_reward / 1000).toFixed(1)}K</span>
            </div>
          ));
        })()}
      </div>

      {/* Top Referrers Leaderboard */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 900, color: '#FF5252', letterSpacing: '1px' }}>GLOBAL LEADERBOARD</h3>
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
              <span style={{ fontSize: '10px', color: '#FFFFFF' }}>{formatNumber(u.taps)} total taps</span>
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
