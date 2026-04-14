import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { formatNumber, shortAddr } from '../utils/format.js';
import toast from 'react-hot-toast';

export default function ReferralScreen() {
  const store = useGameStore();
  const walletAddress = store?.walletAddress;
  const directRefs = store?.directRefs || 0;
  const localReward = store?.localReward || 0;
  const leaderboard = store?.leaderboard || [];
  const referralList = store?.referralList || [];
  const fetchLeaderboardData = store?.fetchLeaderboardData;
  const fetchReferralData = store?.fetchReferralData;
  const sponsorWallet = store?.sponsorWallet;
  const hasNode = store?.hasNode;
  const nodeId = store?.nodeId;
  const loadingReferrals = store?.loadingReferrals || false;
  const activatedRefs = store?.activatedRefs || 0;

  const [inviteTab, setInviteTab] = useState('activated');

  // Smart tab defaulting: if no activated nodes but we have refs, show Free tab
  useEffect(() => {
    if (Array.isArray(referralList) && referralList.length > 0 && Number(activatedRefs || 0) === 0 && inviteTab === 'activated') {
      setInviteTab('free');
    }
  }, [referralList, activatedRefs, inviteTab]);

  useEffect(() => {
    if (fetchLeaderboardData) fetchLeaderboardData();
    if (walletAddress && fetchReferralData) fetchReferralData();
  }, [walletAddress, fetchLeaderboardData, fetchReferralData]);

  const isFreeActive = store?.isFreeActive || false;

  // Dual referral strategy: node owners use Node ID, free users use wallet address
  const refToken = nodeId || walletAddress;
  const inviteLink = walletAddress 
    ? `${window.location.origin}/?ref=${refToken}` 
    : 'Connect wallet to get link';
  const linkType = nodeId ? 'NODE ID' : 'WALLET';
  
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
        {/* Referral link type badge */}
        <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.5, padding: '3px 10px', borderRadius: 20,
            background: nodeId ? 'rgba(163,255,18,0.15)' : 'rgba(79,195,247,0.15)',
            color: nodeId ? 'var(--neon-lime)' : '#4FC3F7',
            border: `1px solid ${nodeId ? 'rgba(163,255,18,0.3)' : 'rgba(79,195,247,0.3)'}`
          }}>
            {nodeId ? `⬡ NODE ID #${nodeId}` : '👤 WALLET ADDRESS'}
          </span>
          {!nodeId && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>Activate a node to upgrade your link</span>}
        </div>
        <div style={{ 
          display: 'flex', flexDirection: 'column', gap: 4,
          background: 'rgba(163, 255, 18, 0.05)', 
          borderRadius: '16px', padding: '16px',
          border: '1px solid rgba(163, 255, 18, 0.2)',
          boxShadow: '0 0 20px rgba(163, 255, 18, 0.05)',
          cursor: 'pointer'
        }} onClick={() => copyLink(inviteLink)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
             <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--neon-lime)', letterSpacing: 1.5 }}>TAP TO COPY LINK</span>
             <span style={{ fontSize: '12px' }}>📋</span>
          </div>
          <div style={{ 
            display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.4)', 
            borderRadius: '12px', padding: '12px 14px',
            border: '1px solid rgba(163, 255, 18, 0.1)'
          }}>
            <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--neon-lime)', fontWeight: 800 }}>
              {inviteLink}
            </div>
          </div>
        </div>

        {/* ─ Social Share Buttons ─ */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.45)', letterSpacing: 2, marginBottom: 10 }}>
            SHARE ON SOCIAL MEDIA
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* WhatsApp */}
            <button onClick={() => {
              const msg = hasNode
                ? encodeURIComponent(`🔥 I'm mining $AIP tokens on AIPCore — earn 200 coins/hr with 18-level matrix income!\n\n🔗 Join with my link: ${inviteLink}\n\n⬡ One-time activation | 70% matrix | 10% referral | 5% Global Pool`)
                : encodeURIComponent(`🆓 Join AIPCore FREE — mine $AIP coins with no upfront cost during the 30-day free trial!\n\n🔗 Join with my link: ${inviteLink}\n\nActivate a node later to unlock 10x earnings, BNB rewards & matrix income.`);
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
              const msg = hasNode
                ? encodeURIComponent(`🚀 Join me on AIPCore — mine $AIP 24/7 with binary matrix rewards!\n\nEarn from 4 income streams:\n💰 10% Referral\n🔷 70% Matrix\n⬡ 15% Level Income\n🏊 5% Global Pool\n\nActivate your node 👇\n${inviteLink}`)
                : encodeURIComponent(`🆓 Try AIPCore FREE for 30 days — mine $AIP coins with no cost!\n\n🔗 Join free: ${inviteLink}\n\nEarn 10 coins/hr during trial. Activate a node later for 10x more rewards, BNB income & binary matrix.`);
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 900, color: '#4FC3F7', margin: 0, letterSpacing: '1px' }}>MY RECENT INVITES</h3>
        <button 
          onClick={fetchReferralData}
          disabled={loadingReferrals}
          title="Refresh List"
          style={{ 
            display: 'flex', alignItems: 'center', gap: '7px',
            background: loadingReferrals ? 'rgba(79,195,247,0.05)' : 'rgba(79,195,247,0.12)',
            border: '1px solid rgba(79,195,247,0.4)',
            borderRadius: '20px',
            color: '#4FC3F7',
            cursor: loadingReferrals ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.5px',
            padding: '8px 16px',
            opacity: loadingReferrals ? 0.5 : 1,
            transition: 'all 0.2s ease',
            boxShadow: loadingReferrals ? 'none' : '0 0 10px rgba(79,195,247,0.15)',
          }}
        >
          <span style={{ fontSize: '16px', lineHeight: 1 }}>{loadingReferrals ? '⌛' : '🔄'}</span>
          <span>{loadingReferrals ? 'SYNCING...' : 'REFRESH'}</span>
        </button>
      </div>
      
      {/* Referral Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button onClick={() => setInviteTab('activated')} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: inviteTab === 'activated' ? '1px solid var(--neon-lime)' : '1px solid rgba(255,255,255,0.05)', background: inviteTab === 'activated' ? 'rgba(163,255,18,0.08)' : 'rgba(255,255,255,0.02)', color: inviteTab === 'activated' ? 'var(--neon-lime)' : '#FFFFFF', fontWeight: 800, fontSize: '11px', cursor: 'pointer' }}>
          ACTIVATED NODES
        </button>
        <button onClick={() => setInviteTab('free')} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: inviteTab === 'free' ? '1px solid #4FC3F7' : '1px solid rgba(255,255,255,0.05)', background: inviteTab === 'free' ? 'rgba(79,195,247,0.08)' : 'rgba(255,255,255,0.02)', color: inviteTab === 'free' ? '#4FC3F7' : '#FFFFFF', fontWeight: 800, fontSize: '11px', cursor: 'pointer' }}>
          FREE MEMBERS
        </button>
      </div>

      <div className="booster-card" style={{ padding: '8px 16px', marginBottom: '32px', minHeight: '100px', position: 'relative' }}>
        {loadingReferrals && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', zIndex: 5, backdropFilter: 'blur(2px)' }}>
            <span style={{ fontSize: '10px', fontWeight: 900, color: '#A3FF12', letterSpacing: '2px' }}>SYNCING...</span>
          </div>
        )}
        {(() => {
          const safeList = Array.isArray(referralList) ? referralList : [];
          const filteredList = safeList.filter(f => {
            const tier = Number(f?.node_tier || 0);
            return inviteTab === 'activated' ? tier > 0 : tier === 0;
          });
          
          if (filteredList.length === 0 && !loadingReferrals) {
            return (
              <div style={{ padding: '30px 20px', textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                No {inviteTab === 'activated' ? 'activated nodes' : 'free members'} found.
              </div>
            );
          }

          return filteredList.slice(0, 50).map((friend, i) => {
            const isActivated = Number(friend.node_tier) > 0;
            // Bug fix: parse trial_days_left from backend API (default to 0 if missing)
            const friendDaysLeft = !isActivated ? (friend.trial_days_left || 0) : null;
            const trialExpired = friendDaysLeft !== null && friendDaysLeft === 0;
            return (
            <div key={i} style={{ 
              display: 'flex', alignItems: 'center', padding: '12px 0',
              borderBottom: i < filteredList.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
            }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isActivated ? 'rgba(203,255,1,0.15)' : trialExpired ? 'rgba(255,59,48,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                {isActivated ? '⬡' : trialExpired ? '⏰' : '👤'}
              </div>
              <div className="flex-column" style={{ flex: 1, marginLeft: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800 }}>{shortAddr(friend.wallet_address)}</span>
                <span style={{ fontSize: '10px', color: isActivated ? 'var(--neon-lime)' : trialExpired ? '#FF3B30' : '#4FC3F7', fontWeight: 700 }}>
                  {isActivated 
                    ? `✅ Node Active (T${friend.node_tier})` 
                    : trialExpired 
                      ? '⚠️ Trial Expired — needs activation'
                      : `🔵 Free Trial — ${friendDaysLeft}d left`}
                </span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 900, color: isActivated ? 'var(--neon-lime)' : '#FFFFFF' }}>{(friend.local_reward / 1000).toFixed(1)}K</span>
            </div>
          );});
        })()}
      </div>

      {/* --- FREE MEMBERS MILESTONES --- */}
      <h3 style={{ fontSize: '12px', fontWeight: 900, color: '#4FC3F7', margin: '32px 0 16px', letterSpacing: '1px' }}>FREE REFERRAL MILESTONES</h3>
      <div className="flex-column" style={{ gap: 12, marginBottom: 40 }}>
        {[
          { threshold: 5,   reward: 1000,    label: '5 Free Friends' },
          { threshold: 10,  reward: 5000,    label: '10 Free Friends' },
          { threshold: 25,  reward: 15000,   label: '25 Free Friends' },
          { threshold: 50,  reward: 50000,   label: '50 Free Friends' },
          { threshold: 100, reward: 200000,  label: '100 Free Friends' },
        ].map((m) => {
          const { claimedMilestones, claimFreeMilestoneAction } = useGameStore.getState();
          const isClaimed = (claimedMilestones || []).includes(`free_${m.threshold}`);
          const canClaim = directRefs >= m.threshold && !isClaimed;
          const progress = Math.min((directRefs / m.threshold) * 100, 100);

          return (
            <div key={`free-${m.threshold}`} className="partner-card" style={{ 
              padding: '16px', border: canClaim ? '1px solid #4FC3F7' : '1px solid rgba(255,255,255,0.05)',
              background: isClaimed ? 'rgba(79,195,247,0.05)' : 'var(--bg-card)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 40, height: 40, borderRadius: 10, background: 'rgba(79,195,247,0.1)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 
                  }}>
                    👋
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: '#4FC3F7', fontWeight: 700 }}>+{formatNumber(m.reward)} $AIP</div>
                  </div>
                </div>

                {isClaimed ? (
                  <span style={{ color: '#4FC3F7', fontWeight: 900, fontSize: 12 }}>CLAIMED ✓</span>
                ) : (
                  <button
                    onClick={async () => {
                      if (!canClaim) {
                        toast.error(`You need ${m.threshold} friends to claim this!`);
                        return;
                      }
                      const tid = toast.loading('Claiming milestone...');
                      try {
                        await claimFreeMilestoneAction(m.threshold);
                        toast.success(`Milestone Claimed! +${formatNumber(m.reward)} AIP`, { id: tid });
                      } catch (err) {
                        toast.error(err.message, { id: tid });
                      }
                    }}
                    style={{
                      background: canClaim ? '#4FC3F7' : 'rgba(255,255,255,0.05)',
                      color: canClaim ? '#000' : 'rgba(255,255,255,0.3)',
                      border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 900,
                      cursor: canClaim ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {canClaim ? 'CLAIM' : 'LOCKED'}
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
                <span>{directRefs} / {m.threshold} Trial Friends</span>
                <span>{Math.floor(progress)}%</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', width: `${progress}%`, 
                  background: isClaimed ? '#4FC3F7' : 'linear-gradient(90deg, rgba(79,195,247,0.5), #4FC3F7)',
                  transition: 'width 0.5s ease-out'
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Referrers Leaderboard */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 900, color: '#FF5252', letterSpacing: '1px' }}>GLOBAL LEADERBOARD</h3>
        <span style={{ fontSize: '10px', color: 'var(--neon-lime)', fontWeight: 800 }}>LIVE STATS</span>
      </div>
      
      <div className="booster-card" style={{ padding: '8px 16px' }}>
        {(Array.isArray(leaderboard) ? leaderboard : []).slice(0, 10).map((u, i) => (
          <div key={i} style={{ 
            display: 'flex', alignItems: 'center', padding: '12px 0',
            borderBottom: i < 9 && i < (leaderboard?.length || 0) - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
          }}>
            <span style={{ width: '24px', fontSize: '13px', fontWeight: 900, color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--text-dim)' }}>#{i + 1}</span>
            <div className="flex-column" style={{ flex: 1, marginLeft: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: u?.wallet_address === walletAddress ? 'var(--neon-lime)' : '#fff' }}>
                {u?.wallet_address ? shortAddr(u.wallet_address) : '...'} {u?.wallet_address === walletAddress && '(YOU)'}
              </span>
              <span style={{ fontSize: '10px', color: '#FFFFFF' }}>{formatNumber(u?.taps || 0)} total taps</span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--neon-lime)' }}>{( (u?.local_reward || 0) / 1000000).toFixed(2)}M</span>
          </div>
        ))}
        {(!leaderboard || leaderboard.length === 0) && (
          <div style={{ padding: '20px', textAlign: 'center', fontSize: '11px', opacity: 0.5 }}>Syncing global rankings...</div>
        )}
      </div>
    </div>
  );
}
