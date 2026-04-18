import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore.js';
import { formatNumber, shortAddr } from '../utils/format.js';
import toast from 'react-hot-toast';

// ── Milestone config ──────────────────────────────────────────────────────────
const MILESTONES = [5, 10, 25, 50, 100, 250, 500];
function getNextMilestone(n) { return MILESTONES.find(m => m > n) || MILESTONES[MILESTONES.length - 1]; }
function getPrevMilestone(n) { return [...MILESTONES].reverse().find(m => m <= n) || 0; }

// ── Milestone Progress Tracker ────────────────────────────────────────────────
function MilestoneTracker({ total }) {
  const next = getNextMilestone(total);
  const prev = getPrevMilestone(total);
  const pct  = next > prev ? Math.min(100, ((total - prev) / (next - prev)) * 100) : 100;

  return (
    <div style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: 16, padding: '14px 16px', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 900, color: '#FFD700', letterSpacing: 1 }}>🏆 TEAM MILESTONE</span>
        <span style={{ fontSize: 12, fontWeight: 900, color: '#fff' }}>{total} / {next} nodes</span>
      </div>
      <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ height: '100%', background: 'linear-gradient(90deg, #A3FF12, #FFD700)', borderRadius: 3 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {MILESTONES.slice(0, 6).map(m => (
          <div key={m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: total >= m ? '#A3FF12' : 'rgba(255,255,255,0.1)', border: `2px solid ${total >= m ? '#A3FF12' : 'rgba(255,255,255,0.15)'}`, boxShadow: total >= m ? '0 0 6px #A3FF1288' : 'none', transition: 'all 0.3s' }} />
            <span style={{ fontSize: 7, color: total >= m ? '#A3FF12' : 'rgba(255,255,255,0.3)', fontWeight: 800 }}>{m >= 250 ? `${m/100*100}` : m}</span>
          </div>
        ))}
      </div>
      {pct >= 100 && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          style={{ textAlign: 'center', marginTop: 8, fontSize: 11, fontWeight: 900, color: '#A3FF12' }}>
          🎉 MILESTONE REACHED! Keep building!
        </motion.div>
      )}
    </div>
  );
}

// ── Viral Share Card ──────────────────────────────────────────────────────────
function ShareCard({ nodeId, nodeTier, miningRate, teamSize, directRefs, inviteLink, hasNode }) {
  const [copied, setCopied] = useState(false);
  const tierColors = ['#A3FF12','#B4FF3A','#FFD700','#FFC107','#FF9800','#FF7043','#FF5252','#E91E63','#AB47BC','#7E57C2','#5C6BC0','#42A5F5','#26C6DA','#26A69A','#66BB6A','#8BC34A','#CDDC39','#FF9800'];
  const tierColor = tierColors[Math.max(0, (nodeTier || 1) - 1)];

  const cardMsg = hasNode
    ? `🌟 Join me on AIPCore Protocol!

⬡ Node #${nodeId} | Tier ${nodeTier} ACTIVE
⚡ Mining: ${miningRate} $AIP/hr  
👥 My Team: ${teamSize} nodes | ${directRefs} directs

✅ 18-tier matrix on BSC
✅ Real BNB — 4 income streams  
✅ Runs 24/7, zero maintenance

👇 Activate under my node:
${inviteLink}

Powered by AIPCore Smart Contract 🔗`
    : `🆓 Join AIPCore FREE for 30 days!

Mine $AIP tokens with zero upfront cost.
Upgrade anytime to unlock BNB rewards + 70% matrix income.

👇 Join free under my link:
${inviteLink}

#AIPCore #BSC #Crypto #Mining`;

  const copy = () => {
    navigator.clipboard.writeText(cardMsg).then(() => {
      setCopied(true);
      toast.success('Share message copied! 📋', { style: { background: '#1A1F26', color: '#A3FF12', border: '1px solid rgba(163,255,18,0.2)' } });
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const toTelegram  = () => window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(cardMsg)}`, '_blank');
  const toWhatsApp  = () => window.open(`https://wa.me/?text=${encodeURIComponent(cardMsg)}`, '_blank');
  const toTwitter   = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(hasNode ? `⬡ Mining on AIPCore — Node #${nodeId} Tier ${nodeTier} ACTIVE\n${miningRate} $AIP/hr | Real BNB rewards | 18-tier BSC matrix\n\nActivate under my node 👇\n${inviteLink}\n\n#AIPCore #BSC #DeFi #Mining` : `🆓 Try AIPCore FREE — mine $AIP on BSC\n\n${inviteLink}\n\n#AIPCore #BSC #Mining`)}`, '_blank');

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Visual Card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: `linear-gradient(135deg, ${tierColor}18 0%, rgba(0,0,0,0.6) 100%)`, border: `1.5px solid ${tierColor}50`, borderRadius: 20, padding: '20px 18px', marginBottom: 12, boxShadow: `0 0 30px ${tierColor}15`, position: 'relative', overflow: 'hidden' }}>
        {/* Ambient glow */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle, ${tierColor}20, transparent)`, pointerEvents: 'none' }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5 }}>AIPCORE PROTOCOL · BSC</div>
            {hasNode ? (
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginTop: 2 }}>NODE #{nodeId}</div>
            ) : (
              <div style={{ fontSize: 18, fontWeight: 900, color: '#FFD700', marginTop: 2 }}>FREE MEMBER</div>
            )}
          </div>
          <div style={{ background: `${tierColor}25`, border: `1.5px solid ${tierColor}70`, borderRadius: 12, padding: '6px 14px', textAlign: 'center', boxShadow: `0 0 10px ${tierColor}30` }}>
            {hasNode ? (
              <>
                <div style={{ fontSize: 18, fontWeight: 900, color: tierColor }}>T{nodeTier}</div>
                <div style={{ fontSize: 8, color: tierColor, fontWeight: 800, letterSpacing: 0.5 }}>TIER</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#FFD700' }}>FREE</div>
                <div style={{ fontSize: 8, color: '#FFD700', fontWeight: 800 }}>TRIAL</div>
              </>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'MINING', val: `${miningRate}`, unit: '$AIP/hr', color: tierColor },
            { label: 'DAILY',  val: `${(miningRate * 24).toLocaleString()}`, unit: '$AIP', color: '#FFD700' },
            { label: 'TEAM',   val: `${teamSize}`, unit: 'nodes', color: '#4FC3F7' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '8px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 7, color: s.color, fontWeight: 700, opacity: 0.8 }}>{s.unit}</div>
              <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', fontWeight: 800, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Link row */}
        <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>🔗</span>
          <span style={{ fontSize: 10, color: '#A3FF12', fontWeight: 700, flex: 1, wordBreak: 'break-all' }}>{inviteLink}</span>
        </div>

        {/* Verified badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#A3FF12', boxShadow: '0 0 4px #A3FF12' }} />
          <span style={{ fontSize: 8, color: 'rgba(163,255,18,0.7)', fontWeight: 800, letterSpacing: 0.5 }}>BSC SMART CONTRACT · AUDITABLE ON-CHAIN</span>
        </div>
      </motion.div>

      {/* Platform Share Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
        <motion.button whileTap={{ scale: 0.95 }} onClick={toTelegram}
          style={{ background: 'linear-gradient(135deg, #2AABEE, #229ED9)', border: 'none', borderRadius: 14, padding: '12px 6px', color: '#fff', fontWeight: 900, fontSize: 11, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 20 }}>✈️</span> TELEGRAM
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={toWhatsApp}
          style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', border: 'none', borderRadius: 14, padding: '12px 6px', color: '#fff', fontWeight: 900, fontSize: 11, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 20 }}>💬</span> WHATSAPP
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={toTwitter}
          style={{ background: 'linear-gradient(135deg, #1DA1F2, #0d8ecf)', border: 'none', borderRadius: 14, padding: '12px 6px', color: '#fff', fontWeight: 900, fontSize: 11, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 20 }}>𝕏</span> TWITTER
        </motion.button>
      </div>
      <motion.button whileTap={{ scale: 0.97 }} onClick={copy}
        style={{ width: '100%', background: copied ? 'rgba(163,255,18,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${copied ? '#A3FF12' : 'rgba(255,255,255,0.1)'}`, borderRadius: 14, padding: '13px', color: copied ? '#A3FF12' : '#fff', fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
        {copied ? '✅ COPIED TO CLIPBOARD!' : '📋 COPY SHARE MESSAGE'}
      </motion.button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ReferralScreen() {
  const store             = useGameStore();
  const walletAddress     = store?.walletAddress;
  const directRefs        = store?.directRefs || 0;
  const teamSize          = store?.teamSize || 0;
  const localReward       = store?.localReward || 0;
  const leaderboard       = store?.leaderboard || [];
  const referralList      = store?.referralList || [];
  const fetchLeaderboardData = store?.fetchLeaderboardData;
  const fetchReferralData    = store?.fetchReferralData;
  const sponsorWallet     = store?.sponsorWallet;
  const hasNode           = store?.hasNode;
  const nodeId            = store?.nodeId;
  const nodeTier          = store?.nodeTier || 1;
  const miningRate        = store?.miningRate || 100;
  const loadingReferrals  = store?.loadingReferrals || false;
  const activatedRefs     = store?.activatedRefs || 0;
  const isFreeActive      = store?.isFreeActive || false;

  const [inviteTab, setInviteTab] = useState('activated');
  const [showShareCard, setShowShareCard] = useState(false);

  const safeReferralList = Array.isArray(referralList) ? referralList : [];

  // A referral is "activated" if they have a node_id assigned OR node_active=true OR node_tier > 0.
  // node_tier may lag behind due to RPC sync delay, so we use all three signals.
  const isActivated  = (f) => Number(f?.node_id || 0) > 0 || f?.node_active === true || Number(f?.node_tier || 0) > 0;
  const activatedList = safeReferralList.filter(f => isActivated(f));
  const freeTrialList = safeReferralList.filter(f => !isActivated(f) && Number(f?.trial_days_left || 0) > 0);
  const expiredList   = safeReferralList.filter(f => !isActivated(f) && Number(f?.trial_days_left || 0) === 0);


  const conversionRate   = safeReferralList.length > 0
    ? ((activatedList.length / safeReferralList.length) * 100).toFixed(1) : '0.0';

  useEffect(() => {
    if (safeReferralList.length > 0 && activatedList.length === 0 && inviteTab === 'activated') {
      setInviteTab(freeTrialList.length > 0 ? 'free' : 'expired');
    }
  }, [safeReferralList.length, activatedList.length]);

  useEffect(() => {
    if (fetchLeaderboardData) fetchLeaderboardData();
    if (walletAddress && fetchReferralData) fetchReferralData();
  }, [walletAddress, fetchLeaderboardData, fetchReferralData]);

  const refToken   = nodeId || walletAddress;
  const inviteLink = walletAddress ? `${window.location.origin}/?ref=${refToken}` : 'Connect wallet to get link';

  const copyLink = (link) => {
    navigator.clipboard.writeText(link).then(() => {
      toast.success('LINK COPIED! 🔗', { style: { background: '#1A1F26', color: '#A3FF12', border: '1px solid rgba(163,255,18,0.2)' } });
    }).catch(() => toast.error('COPY FAILED'));
  };

  return (
    <div className="page page-referral" style={{ paddingBottom: '120px' }}>

      {/* ── Page Header ── */}
      <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '6px' }}>INVITE FRIENDS</h2>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Grow your network · Earn from every level
        </p>
      </div>

      {/* ── Referred By ── */}
      {sponsorWallet && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'linear-gradient(135deg, rgba(79,195,247,0.1), transparent)', border: '1px solid rgba(79,195,247,0.3)', borderRadius: 16, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(79,195,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🔗</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#FFB74D', letterSpacing: 1 }}>REFERRED BY</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#4FC3F7', marginTop: 2 }}>{shortAddr(sponsorWallet)}</div>
          </div>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(79,195,247,0.6)', background: 'rgba(79,195,247,0.08)', padding: '4px 8px', borderRadius: 8 }}>SPONSOR</div>
        </div>
      )}

      {/* ── Milestone Tracker ── */}
      <MilestoneTracker total={safeReferralList.length} />

      {/* ── 4-stat summary grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        <div className="booster-card" style={{ margin: 0, padding: '14px', alignItems: 'center', border: '1px solid rgba(163,255,18,0.2)', background: 'rgba(203,255,1,0.04)' }}>
          <span style={{ fontSize: '26px', fontWeight: 900, color: 'var(--neon-lime)' }}>{safeReferralList.length}</span>
          <span style={{ fontSize: '9px', color: '#FFB74D', fontWeight: 800, marginTop: 2 }}>TOTAL INVITED</span>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginTop: 1 }}>{hasNode ? 'Node Owner' : 'Free User'}</span>
        </div>
        <div className="booster-card" style={{ margin: 0, padding: '14px', alignItems: 'center', border: '1px solid rgba(163,255,18,0.15)', background: 'rgba(255,255,255,0.02)' }}>
          <span style={{ fontSize: '26px', fontWeight: 900, color: 'var(--neon-lime)' }}>{activatedList.length}</span>
          <span style={{ fontSize: '9px', color: '#A3FF12', fontWeight: 800, marginTop: 2 }}>ACTIVATED NODES</span>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginTop: 1 }}>Conv: {conversionRate}%</span>
        </div>
        <div className="booster-card" style={{ margin: 0, padding: '14px', alignItems: 'center', border: '1px solid rgba(79,195,247,0.15)', background: 'rgba(79,195,247,0.03)' }}>
          <span style={{ fontSize: '26px', fontWeight: 900, color: '#4FC3F7' }}>{freeTrialList.length}</span>
          <span style={{ fontSize: '9px', color: '#4FC3F7', fontWeight: 800, marginTop: 2 }}>IN FREE TRIAL</span>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginTop: 1 }}>Active users</span>
        </div>
        <div className="booster-card" style={{ margin: 0, padding: '14px', alignItems: 'center', border: '1px solid rgba(255,59,48,0.15)', background: 'rgba(255,59,48,0.03)' }}>
          <span style={{ fontSize: '26px', fontWeight: 900, color: '#FF5252' }}>{expiredList.length}</span>
          <span style={{ fontSize: '9px', color: '#FF5252', fontWeight: 800, marginTop: 2 }}>TRIAL EXPIRED</span>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginTop: 1 }}>Need activation</span>
        </div>
      </div>

      {/* ── Viral Share Section ── */}
      <div style={{ marginBottom: 24 }}>
        {/* Referral Link box */}
        <div style={{ background: 'rgba(163,255,18,0.05)', border: '1px solid rgba(163,255,18,0.2)', borderRadius: 16, padding: '14px 16px', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--neon-lime)', letterSpacing: 1.5 }}>YOUR REFERRAL LINK</span>
            <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: nodeId ? 'rgba(163,255,18,0.15)' : 'rgba(79,195,247,0.15)', color: nodeId ? 'var(--neon-lime)' : '#4FC3F7', border: `1px solid ${nodeId ? 'rgba(163,255,18,0.3)' : 'rgba(79,195,247,0.3)'}` }}>
              {nodeId ? `⬡ NODE #${nodeId}` : '👤 WALLET'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: '10px 14px', cursor: 'pointer', gap: 10 }} onClick={() => copyLink(inviteLink)}>
            <span style={{ flex: 1, fontSize: 12, color: 'var(--neon-lime)', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inviteLink}</span>
            <span style={{ fontSize: 16 }}>📋</span>
          </div>
        </div>

        {/* Share Card Toggle Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowShareCard(v => !v)}
          style={{ width: '100%', background: showShareCard ? 'rgba(163,255,18,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${showShareCard ? 'rgba(163,255,18,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 14, padding: '14px', color: showShareCard ? '#A3FF12' : '#fff', fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12, transition: 'all 0.3s' }}>
          <span style={{ fontSize: 18 }}>🚀</span>
          {showShareCard ? 'HIDE SHARE CARD' : 'SHARE YOUR NODE CARD'}
          <span style={{ marginLeft: 'auto', fontSize: 14 }}>{showShareCard ? '▲' : '▼'}</span>
        </motion.button>

        {/* Expandable Share Card */}
        <AnimatePresence>
          {showShareCard && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}>
              <ShareCard
                nodeId={nodeId}
                nodeTier={nodeTier}
                miningRate={miningRate}
                teamSize={teamSize}
                directRefs={directRefs}
                inviteLink={inviteLink}
                hasNode={hasNode}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick social links (always visible) */}
        {!showShareCard && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: 'TELEGRAM', emoji: '✈️', color: '#2AABEE', bg: 'rgba(42,171,238,0.1)', border: 'rgba(42,171,238,0.3)', onClick: () => { const msg = hasNode ? `🚀 Join me on AIPCore!\n\n⬡ Node #${nodeId} | Tier ${nodeTier}\n⚡ ${miningRate} $AIP/hr mining\n\nActivate under my node:\n${inviteLink}` : `🆓 Try AIPCore FREE for 30 days!\n\n${inviteLink}`; window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(msg)}`, '_blank'); } },
              { label: 'WHATSAPP', emoji: '💬', color: '#25D366', bg: 'rgba(37,211,102,0.1)', border: 'rgba(37,211,102,0.3)', onClick: () => { const msg = hasNode ? `🌟 Join me on AIPCore Protocol!\n\nNode #${nodeId} | Tier ${nodeTier} ACTIVE\n⚡ ${miningRate} $AIP/hr | Real BNB rewards\n\n${inviteLink}` : `🆓 Try AIPCore FREE!\n${inviteLink}`; window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank'); } },
              { label: 'TWITTER/X', emoji: '𝕏', color: '#fff', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.15)', onClick: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`⬡ Mining on AIPCore — Node #${nodeId} Tier ${nodeTier}\n${miningRate} $AIP/hr | Real BNB rewards\n\n${inviteLink}\n\n#AIPCore #BSC #DeFi`)}`, '_blank') },
            ].map((btn, i) => (
              <button key={i} onClick={btn.onClick} style={{ background: btn.bg, border: `1px solid ${btn.border}`, borderRadius: 14, padding: '12px 6px', color: btn.color, fontWeight: 900, fontSize: 10, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 20 }}>{btn.emoji}</span> {btn.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Invite List ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 900, color: '#4FC3F7', margin: 0, letterSpacing: '1px' }}>MY RECENT INVITES</h3>
        <button onClick={fetchReferralData} disabled={loadingReferrals}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', background: loadingReferrals ? 'rgba(79,195,247,0.05)' : 'rgba(79,195,247,0.12)', border: '1px solid rgba(79,195,247,0.4)', borderRadius: '20px', color: '#4FC3F7', cursor: loadingReferrals ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 800, padding: '8px 16px', opacity: loadingReferrals ? 0.5 : 1 }}>
          <span style={{ fontSize: '16px' }}>{loadingReferrals ? '⌛' : '🔄'}</span>
          <span>{loadingReferrals ? 'SYNCING...' : 'REFRESH'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {[
          { key: 'activated', label: 'ACTIVATED',  count: activatedList.length,  activeColor: 'var(--neon-lime)', activeBg: 'rgba(163,255,18,0.08)', activeBorder: 'var(--neon-lime)' },
          { key: 'free',      label: 'FREE TRIAL', count: freeTrialList.length,   activeColor: '#4FC3F7',          activeBg: 'rgba(79,195,247,0.08)',  activeBorder: '#4FC3F7' },
          { key: 'expired',   label: 'EXPIRED',    count: expiredList.length,     activeColor: '#FF5252',          activeBg: 'rgba(255,59,48,0.08)',   activeBorder: '#FF5252' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setInviteTab(tab.key)} style={{ flex: 1, padding: '8px 4px', borderRadius: '12px', border: inviteTab === tab.key ? `1px solid ${tab.activeBorder}` : '1px solid rgba(255,255,255,0.06)', background: inviteTab === tab.key ? tab.activeBg : 'rgba(255,255,255,0.02)', color: inviteTab === tab.key ? tab.activeColor : 'rgba(255,255,255,0.5)', fontWeight: 800, fontSize: '9px', cursor: 'pointer', letterSpacing: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: inviteTab === tab.key ? tab.activeColor : '#fff' }}>{tab.count}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Referral list */}
      <div className="booster-card" style={{ padding: '8px 16px', marginBottom: '32px', minHeight: '100px', position: 'relative' }}>
        {loadingReferrals && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', zIndex: 5, backdropFilter: 'blur(2px)' }}>
            <span style={{ fontSize: '10px', fontWeight: 900, color: '#A3FF12', letterSpacing: '2px' }}>SYNCING...</span>
          </div>
        )}
        {(() => {
          const displayList = inviteTab === 'activated' ? activatedList : inviteTab === 'free' ? freeTrialList : expiredList;
          if (displayList.length === 0 && !loadingReferrals) {
            const emptyMsg = {
              activated: { icon: '⬡', text: 'No activated nodes yet.', sub: 'Share your card to convert free trial members!' },
              free:      { icon: '👤', text: 'No active free trial members.', sub: 'All invites either activated or expired.' },
              expired:   { icon: '⏰', text: 'No expired trials.', sub: 'Great — everyone is still active!' },
            }[inviteTab];
            return (
              <div style={{ padding: '30px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{emptyMsg.icon}</div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>{emptyMsg.text}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: 4, fontWeight: 600 }}>{emptyMsg.sub}</div>
              </div>
            );
          }
          return displayList.slice(0, 50).map((friend, i) => {
            const isActivated = Number(friend.node_tier) > 0;
            const daysLeft    = Number(friend.trial_days_left || 0);
            const isExpired   = !isActivated && daysLeft === 0;
            const isFreeTrial = !isActivated && daysLeft > 0;
            const rowColor    = isActivated ? 'var(--neon-lime)' : isExpired ? '#FF5252' : '#4FC3F7';
            const rowIcon     = isActivated ? '⬡' : isExpired ? '⏰' : '👤';
            const rowBg       = isActivated ? 'rgba(203,255,1,0.12)' : isExpired ? 'rgba(255,59,48,0.12)' : 'rgba(79,195,247,0.08)';
            const statusText  = isActivated ? `✅ Node Active — Tier ${friend.node_tier}` : isExpired ? '⚠️ Trial Expired — nudge them!' : `🔵 Free Trial — ${daysLeft}d left`;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: i < displayList.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{rowIcon}</div>
                <div style={{ flex: 1, marginLeft: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'block' }}>{shortAddr(friend.wallet_address)}</span>
                  <span style={{ fontSize: 10, color: rowColor, fontWeight: 700 }}>{statusText}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 900, color: rowColor }}>{Number(friend.local_reward || 0) >= 1000 ? `${(friend.local_reward / 1000).toFixed(1)}K` : Math.floor(friend.local_reward || 0)}</span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>$AIP</span>
                </div>
              </div>
            );
          });
        })()}
      </div>

      {/* ── Free Referral Milestones ── */}
      <h3 style={{ fontSize: '12px', fontWeight: 900, color: '#4FC3F7', margin: '0 0 16px', letterSpacing: '1px' }}>FREE REFERRAL MILESTONES</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
        {[
          { threshold: 5,   reward: 1000,   label: '5 Free Friends' },
          { threshold: 10,  reward: 5000,   label: '10 Free Friends' },
          { threshold: 25,  reward: 15000,  label: '25 Free Friends' },
          { threshold: 50,  reward: 50000,  label: '50 Free Friends' },
          { threshold: 100, reward: 200000, label: '100 Free Friends' },
        ].map((m) => {
          const { claimedMilestones, claimFreeMilestoneAction } = useGameStore.getState();
          const isClaimed = (claimedMilestones || []).includes(`free_${m.threshold}`);
          const canClaim  = directRefs >= m.threshold && !isClaimed;
          const progress  = Math.min((directRefs / m.threshold) * 100, 100);
          return (
            <div key={`free-${m.threshold}`} className="partner-card" style={{ padding: '16px', border: canClaim ? '1px solid #4FC3F7' : '1px solid rgba(255,255,255,0.05)', background: isClaimed ? 'rgba(79,195,247,0.05)' : 'var(--bg-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(79,195,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👋</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: '#4FC3F7', fontWeight: 700 }}>+{formatNumber(m.reward)} $AIP</div>
                  </div>
                </div>
                {isClaimed ? (
                  <span style={{ color: '#4FC3F7', fontWeight: 900, fontSize: 12 }}>CLAIMED ✓</span>
                ) : (
                  <button onClick={async () => {
                    if (!canClaim) { toast.error(`Need ${m.threshold} friends to claim!`); return; }
                    const tid = toast.loading('Claiming...');
                    try { await claimFreeMilestoneAction(m.threshold); toast.success(`+${formatNumber(m.reward)} AIP claimed!`, { id: tid }); }
                    catch (err) { toast.error(err.message, { id: tid }); }
                  }} style={{ background: canClaim ? '#4FC3F7' : 'rgba(255,255,255,0.05)', color: canClaim ? '#000' : 'rgba(255,255,255,0.3)', border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 900, cursor: canClaim ? 'pointer' : 'not-allowed' }}>
                    {canClaim ? 'CLAIM' : 'LOCKED'}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
                <span>{directRefs} / {m.threshold} friends</span><span>{Math.floor(progress)}%</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: isClaimed ? '#4FC3F7' : 'linear-gradient(90deg, rgba(79,195,247,0.5), #4FC3F7)', transition: 'width 0.5s ease-out' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Global Leaderboard ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 900, color: '#FF5252', letterSpacing: '1px' }}>GLOBAL LEADERBOARD</h3>
        <span style={{ fontSize: '10px', color: 'var(--neon-lime)', fontWeight: 800 }}>LIVE STATS</span>
      </div>
      <div className="booster-card" style={{ padding: '8px 16px' }}>
        {(Array.isArray(leaderboard) ? leaderboard : []).slice(0, 10).map((u, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: i < 9 && i < (leaderboard?.length || 0) - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <span style={{ width: '24px', fontSize: '13px', fontWeight: 900, color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'rgba(255,255,255,0.4)' }}>#{i + 1}</span>
            <div style={{ flex: 1, marginLeft: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: u?.wallet_address === walletAddress ? 'var(--neon-lime)' : '#fff', display: 'block' }}>
                {u?.wallet_address ? shortAddr(u.wallet_address) : '...'} {u?.wallet_address === walletAddress && '(YOU)'}
              </span>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{formatNumber(u?.taps || 0)} taps</span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--neon-lime)' }}>{((u?.local_reward || 0) / 1000000).toFixed(2)}M</span>
          </div>
        ))}
        {(!leaderboard || leaderboard.length === 0) && (
          <div style={{ padding: '20px', textAlign: 'center', fontSize: '11px', opacity: 0.5 }}>Syncing global rankings...</div>
        )}
      </div>
    </div>
  );
}
