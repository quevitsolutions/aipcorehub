import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getEthersSigner } from '../utils/ethers-adapter.js';
import { ethers } from 'ethers';
import { config } from '../config/wagmi.js';
import { AIPCORE_ABI } from '../../contracts/abi.js';
import { CONTRACTS } from '../config/constants.js';

const MAX_SESSION = 86400000; // 24h

// ── Local mining hook — uses a ref snapshot of claimTime so reset is instant ──
function useLocalMining(lastClaimTime, ratePerHour, isEligible) {
  const [mined, setMined] = useState(0);
  const rafRef = useRef(null);
  const claimTimeRef = useRef(lastClaimTime); // tracks the LATEST claim time without closure lag

  // keep the ref in sync when prop changes (after claim)
  useEffect(() => {
    claimTimeRef.current = lastClaimTime;
    setMined(0); // snap immediately to 0
  }, [lastClaimTime]);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (!isEligible) { setMined(0); return; }

    const tick = () => {
      const elapsed = (Date.now() - claimTimeRef.current) / 3600000;
      setMined(Math.max(0, elapsed * ratePerHour));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [ratePerHour, isEligible]);

  return mined;
}

// ── Registration CTA for non-node users (on-chain) ──
function RegistrationGate({ setActiveTab }) {
  const { referrerId } = useGameStore();
  const [registering, setRegistering] = useState(false);

  const handleRegister = async () => {
    if (registering) return;
    setRegistering(true);
    try {
      const signer = await getEthersSigner(config);
      if (!signer) { toast.error('Connect wallet first'); setRegistering(false); return; }
      const contract = new ethers.Contract(CONTRACTS.AIPCORE, AIPCORE_ABI, signer);
      let sponsorNodeId = 1n;
      if (referrerId) {
        try { const ref = await contract.nodeId(referrerId); if (Number(ref) > 0) sponsorNodeId = ref; } catch { }
      }
      const tierCost = await contract.getTierCost(0);
      toast.loading('Confirm transaction...', { id: 'reg' });
      const tx = await contract.createNode(sponsorNodeId, { value: tierCost });
      toast.loading(`Tx sent: ${tx.hash.slice(0, 10)}...`, { id: 'reg' });
      await tx.wait();
      toast.success('Node registered! Pull to refresh.', { id: 'reg', duration: 5000 });
    } catch (err) {
      let errMsg = err?.reason || err?.message || 'Failed';
      if (errMsg.toLowerCase().includes('insufficient funds')) {
        errMsg = 'Insufficient BNB balance for transaction & gas.';
      } else if (errMsg.includes('user rejected')) {
        errMsg = 'Transaction rejected by user.';
      } else {
        errMsg = errMsg.slice(0, 80);
      }
      toast.error(errMsg, { id: 'reg' });
    } finally { setRegistering(false); }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', padding: '32px 20px', textAlign: 'center', gap: 20
    }}>
      <div style={{
        width: 100, height: 100, borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(163,255,18,0.15), rgba(163,255,18,0.05))',
        border: '2px solid rgba(163,255,18,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48
      }}>⛏️</div>

      <div>
        <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Node Not Activated</h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, maxWidth: 300, margin: '0 auto' }}>
          You need an active AIPCore node to mine coins. Register on-chain to start earning passive income.
        </p>
      </div>

      {[
        { icon: '💰', text: 'Earn 100–2,000+ coins/hr passively' },
        { icon: '🚀', text: 'Boost up to Tier 18 — max rewards' },
        { icon: '👥', text: 'Referral & team bonuses' },
        { icon: '🌐', text: 'Global reward pool participation' },
      ].map((b, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 16px',
          width: '100%', maxWidth: 320, border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <span style={{ fontSize: 22 }}>{b.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{b.text}</span>
        </div>
      ))}

      <button
        onClick={handleRegister}
        disabled={registering}
        style={{
          width: '100%', maxWidth: 320,
          background: registering ? 'rgba(163,255,18,0.4)' : 'var(--neon-lime)',
          border: 'none', borderRadius: 18, padding: '18px', fontSize: 16, fontWeight: 900,
          color: '#000', cursor: registering ? 'wait' : 'pointer',
          boxShadow: '0 0 30px rgba(163,255,18,0.3)'
        }}>
        {registering ? '⏳ Registering...' : '🚀 REGISTER NODE ON-CHAIN →'}
      </button>

      <button onClick={() => setActiveTab('contracts')}
        style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 20px', color: '#FFD700', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
        Learn More →
      </button>
    </div>
  );
}

// ── High-Urgency Alert for Free Users with Progressive Scaling ──
function ActivationAlert({ onAction, daysLeft }) {
  const isCritical = daysLeft <= 3;
  const isHigh = daysLeft <= 10;
  
  // Dynamic styling based on urgency
  const urgencyStyles = {
    bg: isCritical 
      ? 'linear-gradient(90deg, rgba(255, 61, 0, 0.3) 0%, rgba(183, 28, 28, 0.45) 100%)' 
      : (isHigh ? 'linear-gradient(90deg, rgba(255, 112, 67, 0.2) 0%, rgba(255, 61, 0, 0.3) 100%)' : 'linear-gradient(90deg, rgba(255, 112, 67, 0.15) 0%, rgba(255, 112, 67, 0.25) 100%)'),
    border: isCritical ? 'rgba(255, 61, 0, 0.5)' : (isHigh ? 'rgba(255, 112, 67, 0.4)' : 'rgba(255, 112, 67, 0.3)'),
    icon: isCritical ? '🔥' : '⚠️',
    pulse: isCritical ? 0.8 : (isHigh ? 1.5 : 3.0),
    title: isCritical ? 'CRITICAL: NODE EXPIRE SOON' : (isHigh ? 'URGENCY: NODE UNSECURED' : 'NODE STATUS: UNSECURED')
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={onAction}
      style={{
        margin: '0 0 20px',
        padding: '12px 16px',
        background: urgencyStyles.bg,
        borderRadius: 16,
        border: `1px solid ${urgencyStyles.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: 'pointer',
        boxShadow: isCritical ? '0 0 25px rgba(255, 61, 0, 0.2)' : '0 0 15px rgba(255, 61, 0, 0.1)'
      }}
    >
      <motion.div 
        animate={{ scale: isCritical ? [1, 1.3, 1] : [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: urgencyStyles.pulse, repeat: Infinity }}
        style={{ fontSize: 20 }}
      >
        {urgencyStyles.icon}
      </motion.div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: isCritical ? '#FF5252' : '#FF7043', letterSpacing: 1 }}>{urgencyStyles.title}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', marginTop: 2, lineHeight: 1.4 }}>
          {isCritical ? 'ACTIVATE NOW' : 'Activate Master Node'} to <span style={{ color: '#FF7043' }}>SAVE</span> {Math.floor(daysLeft)} days of $AIP & unlock <span style={{ color: 'var(--neon-lime)' }}>10X SPEED</span> 🚀
        </div>
      </div>
      <div style={{ 
        background: 'var(--neon-lime)', 
        color: '#000', 
        fontSize: 9, 
        fontWeight: 950, 
        padding: '6px 10px', 
        borderRadius: 8,
        boxShadow: '0 0 10px rgba(163, 255, 18, 0.3)'
      }}>
        ACTIVATE
      </div>
    </motion.div>
  );
}

export default function EarnScreen() {
  const {
    walletAddress, localReward, nodeTier, isPremium,
    hasNode, nodeId, lastClaimTime, teamHistory, isHistoryLoading,
    claimMined, setActiveTab, addLocalReward, fetchTeamHistory,
    isFreeActive, createdAt, globalHistory, fetchGlobalHistory,
    initialLoaded, pendingMined, lastSyncTime,
    claimedMilestones, claimSignupBonusAction, miningRate
  } = useGameStore();

  const [view, setView] = useState('mining'); // 'mining' | 'history'
  const [historyMode, setHistoryMode] = useState('personal'); // 'personal' | 'global'
  const [isExploding, setIsExploding] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false); // Prevents double-click
  const [isBonusClaiming, setIsBonusClaiming] = useState(false);
  const [displayReward, setDisplayReward] = useState(localReward);
  const [claimedTasks, setClaimedTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aip-tasks') || '[]'); } catch { return []; }
  });
  const [visibleDays, setVisibleDays] = useState(3);
  const [liveRewards, setLiveRewards] = useState([]);
  const latestIncomeRef = useRef(null);

  // Live On-Chain Reward Poller
  useEffect(() => {
    if (!hasNode || !nodeId) return;
    let isMounted = true;

    const pollIncome = async () => {
      try {
        const { blockchain } = await import('../services/blockchain.js');
        const incomes = await blockchain.fetchTeamHistoryOnChain(nodeId, 5);
        if (!isMounted || !incomes || incomes.length === 0) return;

        const latestIdentifier = `${incomes[0].timestamp}_${incomes[0].from_node_id}_${incomes[0].amount_bnb}`;

        // Initialize ref gracefully on first load to prevent flooding
        if (!latestIncomeRef.current) {
          latestIncomeRef.current = latestIdentifier;
          return;
        }

        if (latestIdentifier === latestIncomeRef.current) return; // No new incomes

        // Found new incomes
        let newItems = [];
        for (let i = 0; i < incomes.length; i++) {
          const id = `${incomes[i].timestamp}_${incomes[i].from_node_id}_${incomes[i].amount_bnb}`;
          if (id === latestIncomeRef.current) break;
          newItems.push({ ...incomes[i], uniqueId: id + '_' + Math.random() });
        }

        if (newItems.length > 0) {
          latestIncomeRef.current = latestIdentifier;
          setLiveRewards(prev => [...prev, ...newItems.reverse()]); // Oldest of new items first

          // Autoclear after 3.5 seconds
          setTimeout(() => {
            if (isMounted) {
              setLiveRewards(prev => prev.filter(r => !newItems.find(n => n.uniqueId === r.uniqueId)));
            }
          }, 3500);
        }
      } catch (e) {}
    };

    const interval = setInterval(pollIncome, 20000); // 20s poll
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [hasNode, nodeId]);
  // Keep displayReward in sync with store (animates upward only)
  useEffect(() => {
    setDisplayReward(localReward);
  }, [localReward]);

  // Source of truth: miningRate comes from gameStore logic (10 for Free, 100*2^(tier-1) for Node)
  const ratePerHour = miningRate || 10;
  const displayTier = Number(nodeTier || 1);

  // Bug #3 fix: compute isExpired early so we can zero out rate for expired users
  const daysLeftCalc = (initialLoaded && createdAt)
    ? Math.max(0, 30 - Math.floor((Date.now() - new Date(createdAt).getTime()) / (24 * 3600000)))
    : 30;
  const isExpired = initialLoaded && !hasNode && daysLeftCalc <= 0;
  const effectiveRate = isExpired ? 0 : ratePerHour;

  const now = Date.now();
  const elapsed = Math.max(0, now - lastClaimTime);
  
  // Calculate totalMined precisely identical to the backend /api/mining/claim
  const diffHours = elapsed / 3600000;
  const cappedHours = Math.min(diffHours, 24);
  const totalMined = isExpired ? 0 : (cappedHours * effectiveRate);
  
  const totalWealth = Number(localReward || 0) + totalMined;

  // Live timer — re-renders every second
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Bug #3 fix: expired users should see no time remaining
  const timeRemaining = isExpired ? 0 : Math.max(0, MAX_SESSION - elapsed);
  // Bug #2 fix: ring fills for both node owners AND free trial users
  const isActive = hasNode || isFreeActive;
  const maturity = isActive && !isExpired ? Math.min(1, elapsed / MAX_SESSION) : 0;

  const formatTime = (ms) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  const onClaim = async () => {
    // Guard: already in-flight OR nothing accrued OR trial expired
    if (isClaiming || totalMined <= 0 || isExpired) return;
    setIsClaiming(true);
    setIsExploding(true);

    try {
      const ok = await claimMined();
      if (ok) {
        toast.success(`🥚 +${Math.floor(totalMined).toLocaleString()} $AIP claimed!`, { 
          duration: 3000,
          style: {
            background: 'var(--bg-card)',
            color: '#fff',
            border: '1px solid var(--neon-lime)',
            fontWeight: 900
          }
        });
        
        // Finalize explosion
        setTimeout(() => setIsExploding(false), 2000);
        
        if (!hasNode) {
          setTimeout(() => {
            toast('Activate an AIPCore Node to earn real BNB, 10x more coins, and massive pool rewards!', {
              icon: '💎',
              duration: 6000,
              style: { border: '1px solid var(--neon-lime)' }
            });
          }, 1200);
        }
      } else {
        toast.error('Claim failed — please try again.', { duration: 4000 });
        setIsExploding(false);
      }
    } catch (err) {
      toast.error(err?.message || 'Claim failed.', { duration: 4000 });
      setIsExploding(false);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleTaskClaim = (task) => {
    if (claimedTasks.includes(task.id)) return;
    window.open(task.url, '_blank');
    const updated = [...claimedTasks, task.id];
    setClaimedTasks(updated);
    localStorage.setItem('aip-tasks', JSON.stringify(updated));
    addLocalReward(task.reward);
  };

  // Progressive Urgency Logic: Hide until day 20, escalate thereafter
  const daysLeft = daysLeftCalc;
  const shouldShowBanner = initialLoaded && !hasNode && daysLeft <= 20 && !isExpired;

  // Daily Urgency Toast Implementation
  useEffect(() => {
    if (!shouldShowBanner) return;
    
    const todayStr = new Date().toDateString();
    const lastAlert = localStorage.getItem('aip-last-urgency-toast');
    
    if (lastAlert !== todayStr) {
      setTimeout(() => {
        toast.error(`⚠️ Node trial expires in ${Math.floor(daysLeft)} days! Activate now to secure your $AIP.`, {
          duration: 6000,
          position: 'top-center',
          icon: daysLeft <= 3 ? '🔥' : '⚠️',
          style: {
            background: '#1A0B0B',
            color: '#fff',
            border: `1px solid ${daysLeft <= 3 ? '#FF3D00' : '#FF7043'}`,
            fontWeight: 800,
            fontSize: '13px'
          }
        });
        localStorage.setItem('aip-last-urgency-toast', todayStr);
      }, 3000);
    }
  }, [shouldShowBanner, daysLeft]);

  // We no longer use the full-screen RegistrationGate here, 
  // as the "Session Expired" overlay on the mining egg handles the activation nudge better.
  // This ensures users can always see their dashboard and balance.

  return (
    <div className="page-earn" style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>

      {/* ── Tab Switcher Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 12 }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4 }}>
          <button
            onClick={() => setView('mining')}
            style={{
              padding: '6px 16px', borderRadius: 10, border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer',
              background: view === 'mining' ? 'var(--neon-lime)' : 'transparent',
              color: view === 'mining' ? '#000' : '#A3FF12',
              transition: 'all 0.2s'
            }}>⛏️ MINING</button>
          <button
            onClick={() => { setView('history'); fetchTeamHistory(); }}
            style={{
              padding: '6px 16px', borderRadius: 10, border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer',
              background: view === 'history' ? 'var(--neon-lime)' : 'transparent',
              color: view === 'history' ? '#000' : '#4FC3F7',
              transition: 'all 0.2s'
            }}>📜 HISTORY</button>
        </div>

        <button onClick={() => setActiveTab('tasks')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 8, display: 'flex', alignItems: 'center' }}>
          ✅
        </button>
      </div>

      {/* ── Conditional View Content ── */}
      {view === 'mining' ? (
        <>
          {/* Activation Alert (Triggered at Day 20) */}
          {shouldShowBanner && (
            <ActivationAlert 
              daysLeft={daysLeft} 
              onAction={() => setActiveTab('mine')} 
            />
          )}

          {/* ── Balance ── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '20px', fontWeight: 900, color: '#FFD700', letterSpacing: '2px' }}>$AIP</span>
            <motion.span 
              key={totalWealth}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.3 }}
              className="balance-value" 
              style={{ fontSize: 44, fontWeight: 900, color: '#fff', textShadow: '0 0 20px rgba(255,255,255,0.1)' }}
            >
              {totalWealth >= 1 ? Math.floor(totalWealth).toLocaleString('en-US') : totalWealth.toFixed(4)}
            </motion.span>
            </div>
          </div>

          {/* ── Egg Zone ── */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 240 }}>
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

              {/* Maturity circle ring */}
              <svg style={{ position: 'absolute', top: '50%', left: '50%', width: 260, height: 260, transform: 'translate(-50%, -50%) rotate(-90deg)', pointerEvents: 'none' }}>
                <circle cx="130" cy="130" r="120" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                <motion.circle cx="130" cy="130" r="120" fill="none" stroke="var(--neon-lime)" strokeWidth="3"
                  strokeDasharray="754"
                  animate={{ strokeDashoffset: 754 * (1 - maturity) }}
                  transition={{ duration: 1, ease: 'linear' }}
                  strokeLinecap="round" />
              </svg>

              <AnimatePresence>
                {isExploding && (
                  <motion.div initial={{ opacity: 1, scale: 0.8 }} animate={{ opacity: 0, scale: 2 }}
                    style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, var(--neon-lime) 0%, transparent 70%)', zIndex: 5, borderRadius: '50%' }} />
                )}
              </AnimatePresence>

              {/* FLOATING LIVE REWARDS */}
              <div style={{ position: 'absolute', top: '20%', left: 0, right: 0, bottom: 0, zIndex: 100, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <AnimatePresence>
                  {liveRewards.map((reward) => (
                    <motion.div
                      key={reward.uniqueId}
                      initial={{ opacity: 0, y: 0, scale: 0.5 }}
                      animate={{ opacity: 1, y: -70, scale: 1 }}
                      exit={{ opacity: 0, y: -110, scale: 0.8 }}
                      transition={{ duration: 2.5, ease: 'easeOut' }}
                      style={{
                        position: 'absolute',
                        background: 'rgba(0,0,0,0.85)',
                        border: '1px solid rgba(255, 215, 0, 0.5)',
                        boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span style={{ fontSize: 16 }}>✨</span>
                      <span style={{ fontSize: 13, fontWeight: 900, color: '#A3FF12' }}>+{reward.amount_bnb} BNB</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>({reward.event_type})</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* EGG */}
              <div style={{
                position: 'relative', width: 220, height: 220, zIndex: 10,
                WebkitMaskImage: 'radial-gradient(circle, black 50%, transparent 95%)',
                maskImage: 'radial-gradient(circle, black 50%, transparent 95%)'
              }}>
                <img src="/assets/egg_orange.png"
                  loading="eager"
                  style={{
                    width: '100%', height: '100%', objectFit: 'contain',
                    filter: isExpired ? 'grayscale(1) brightness(0.5)' : `drop-shadow(0 0 ${25 * maturity}px rgba(255,165,0,0.4))`
                  }}
                  alt="Mining Egg" />

                {isExpired && (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.6)', borderRadius: '50%', textAlign: 'center', padding: 20, zIndex: 15
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#FF3B30', marginBottom: 8 }}>SESSION EXPIRED</span>
                    <button onClick={() => setActiveTab('mine')} style={{ background: 'var(--neon-lime)', border: 'none', padding: '8px 16px', borderRadius: 12, fontSize: 11, fontWeight: 900, color: '#000', cursor: 'pointer' }}>
                      ACTIVATE NODE
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* TRIAL LEFT - Centered and subtle */}
            {/* Bug #5 fix: guard with initialLoaded to prevent stale flash */}
            {initialLoaded && !hasNode && isFreeActive && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: -10, marginBottom: 20 }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 20px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--neon-lime)', letterSpacing: 0.5 }}>{daysLeft} DAYS TRIAL LEFT</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ flexShrink: 0, padding: '20px 0 10px', background: 'linear-gradient(to top, var(--bg-dark) 50%, transparent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* Bug #3 fix: dot is grey and rate is 0 when expired */}
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: effectiveRate > 0 ? 'var(--neon-lime)' : '#666', boxShadow: effectiveRate > 0 ? '0 0 10px var(--neon-lime)' : 'none' }} />
                <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5 }}>RATE: <span style={{ color: effectiveRate > 0 ? 'var(--neon-lime)' : '#666' }}>{effectiveRate} $AIP/HR</span></span>
              </div>
              {!isExpired && <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>ENDS IN: <span style={{ color: '#fff' }}>{formatTime(timeRemaining)}</span></span>}
              {isExpired && <span style={{ fontSize: 10, fontWeight: 900, color: '#FF3B30', letterSpacing: 1 }}>TRIAL EXPIRED</span>}
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
              {/* BOOST / UPGRADE (70%) */}
              <button
                onClick={() => setActiveTab('mine')}
                style={{
                  flex: 0.7,
                  background: 'var(--neon-lime)',
                  border: 'none', borderRadius: 16, padding: '16px 10px', cursor: 'pointer',
                  boxShadow: '0 0 25px rgba(163, 255, 18, 0.4)',
                  position: 'relative', overflow: 'hidden'
                }}
              >
                <motion.div animate={{ opacity: [1, 0.6, 1] }} transition={{ duration: 2, repeat: Infinity }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontSize: 15, fontWeight: 950, color: '#000', letterSpacing: 0.5 }}>{hasNode ? 'BOOST' : 'UPGRADE'} NODE</span>
                  <span style={{ fontSize: 10, fontWeight: 900 }}>
                    {hasNode 
                      ? <span style={{ color: 'rgba(0,0,0,0.5)' }}>TIER {displayTier} → {displayTier + 1} 🚀</span> 
                      : (!isExpired 
                          ? <span style={{ color: '#000000', fontSize: 11, fontWeight: 950 }}>TRIAL EXPIRES IN {daysLeft} DAYS ⚡</span> 
                          : <span style={{ color: 'rgba(0,0,0,0.5)' }}>ACTIVATE CORE ⚡</span>)
                    }
                  </span>
                </motion.div>
              </button>

              {/* COLLECT (30%) */}
              <button
                onClick={onClaim}
                disabled={isClaiming || isExpired}
                style={{
                  flex: 0.3,
                  background: (!isClaiming && !isExpired) ? '#4FC3F7' : 'rgba(255,255,255,0.04)',
                  border: 'none', borderRadius: 16, padding: '16px 5px',
                  cursor: (!isClaiming && !isExpired) ? 'pointer' : 'default',
                  transition: 'all 0.3s',
                  opacity: isClaiming ? 0.6 : 1
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 950, color: (!isClaiming && !isExpired) ? '#000' : 'rgba(255,255,255,0.2)' }}>
                    {isClaiming ? '⏳' : maturity >= 1 ? '🥚' : 'CLAIM'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: (!isClaiming && !isExpired) ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.1)' }}>$AIP</span>
                    <span style={{ fontSize: 11, fontWeight: 950, color: (!isClaiming && !isExpired) ? '#000' : 'rgba(255,255,255,0.2)' }}>
                      {isClaiming ? '...' : totalMined.toFixed(4)}
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </>
      ) : (
        /* ── HISTORY VIEW ── */
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 4 }}>
              <div
                onClick={() => setHistoryMode('personal')}
                style={{
                  padding: '6px 14px', borderRadius: 16, fontSize: 11, fontWeight: 900, cursor: 'pointer',
                  background: historyMode === 'personal' ? 'var(--neon-lime)' : 'transparent',
                  color: historyMode === 'personal' ? '#000' : '#FFB74D'
                }}
              >MY TEAM</div>
              <div
                onClick={() => { setHistoryMode('global'); fetchGlobalHistory(); }}
                style={{
                  padding: '6px 14px', borderRadius: 16, fontSize: 11, fontWeight: 900, cursor: 'pointer',
                  background: historyMode === 'global' ? 'var(--neon-lime)' : 'transparent',
                  color: historyMode === 'global' ? '#000' : '#FFD700'
                }}
              >LIVE FEED 🌍</div>
            </div>

            <span style={{ fontSize: 10, color: '#A3FF12', cursor: 'pointer', paddingRight: 8 }} onClick={() => historyMode === 'personal' ? fetchTeamHistory() : fetchGlobalHistory()}>🔄</span>
          </div>

          <AnimatePresence mode="wait">
            {isHistoryLoading ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4FC3F7' }}>
                Syncing Blockchain Events...
              </motion.div>
            ) : (historyMode === 'personal' ? teamHistory : globalHistory).length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'rgba(255,255,255,0.2)' }}>
                <div style={{ fontSize: 40 }}>💤</div>
                <p style={{ fontSize: 12, fontWeight: 600 }}>No {historyMode} income found yet.</p>
              </motion.div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {(() => {
                  const grouped = (historyMode === 'personal' ? teamHistory : globalHistory).reduce((acc, item) => {
                    const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                    if (!acc[dateStr]) acc[dateStr] = { items: [], totalBnb: 0, totalUsd: 0 };
                    acc[dateStr].items.push(item);
                    if (!item.is_missed) {
                      acc[dateStr].totalBnb += Number(item.amount_bnb || 0);
                      acc[dateStr].totalUsd += Number(item.amount_usd || 0);
                    }
                    return acc;
                  }, {});

                  const sortedDays = Object.entries(grouped);
                  const displayedDays = sortedDays.slice(0, visibleDays);

                  return (
                    <>
                      {displayedDays.map(([dateLabel, group], groupIdx) => (
                        <div key={dateLabel} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {/* Day divider with Totals */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', marginBottom: 4 }}>
                            <div style={{ fontSize: 11, fontWeight: 900, color: '#FF5252', letterSpacing: 1, textTransform: 'uppercase' }}>
                              {dateLabel}
                            </div>
                            <div style={{ background: 'rgba(79,195,247,0.1)', border: '1px solid rgba(79,195,247,0.2)', padding: '2px 8px', borderRadius: 8, display: 'flex', gap: 8 }}>
                              <span style={{ fontSize: 9, fontWeight: 900, color: '#4FC3F7' }}>{group.totalBnb.toFixed(5)} BNB</span>
                              <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', opacity: 0.6 }}>${group.totalUsd.toFixed(2)}</span>
                            </div>
                          </div>

                          {group.items.map((item, idx) => {
                            const getIcon = (type) => {
                              if (item.is_missed) return '⚠️';
                              switch (type) {
                                case 'Referral': return '🤝';
                                case 'Direct Upgrade': return '⚡';
                                case 'Layer Income': return '🪜';
                                case 'Matrix Income': return '🌀';
                                case 'Global Pool': return '🏆';
                                default: return '💰';
                              }
                            };

                            const isMissed = !!item.is_missed;

                            return (
                              <motion.div
                                key={item.id || item.tx_hash || idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: (groupIdx * 0.05) + (idx * 0.02) }}
                                style={{
                                  background: isMissed ? 'rgba(255,59,48,0.05)' : 'rgba(255,255,255,0.03)',
                                  border: isMissed ? '1px solid rgba(255,59,48,0.2)' : '1px solid rgba(255,255,255,0.06)',
                                  borderRadius: 16, padding: '12px 14px',
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{
                                    width: 32, height: 32, borderRadius: 8,
                                    background: isMissed ? 'rgba(255,59,48,0.1)' : 'rgba(163,255,18,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
                                  }}>
                                    {getIcon(item.event_type)}
                                  </div>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <span style={{ fontSize: 12, fontWeight: 800, color: isMissed ? '#FF3B30' : '#fff' }}>
                                        {item.event_type}
                                      </span>
                                      {isMissed && (
                                        <span style={{ fontSize: 9, background: '#FF3B30', color: '#fff', padding: '2px 5px', borderRadius: 4, fontWeight: 900 }}>MISSED</span>
                                      )}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                      {historyMode === 'global' && item.wallet_address && (
                                        <span style={{ fontSize: 10, color: '#FFFFFF', fontWeight: 700 }}>To {item.wallet_address}</span>
                                      )}
                                      {historyMode === 'personal' && item.from_node_id > 0 && (
                                        <span style={{ fontSize: 10, color: '#FFB74D', fontWeight: 600 }}>From #{item.from_node_id}</span>
                                      )}
                                      {item.tier > 0 && (
                                        <span style={{ fontSize: 9, color: 'var(--neon-lime)', opacity: 0.8 }}>Tier {item.tier}</span>
                                      )}
                                      {item.layer > 0 && (
                                        <span style={{ fontSize: 9, color: '#FFD700' }}>Lvl {item.layer}</span>
                                      )}
                                      <span style={{ fontSize: 9, color: '#4FC3F7', fontWeight: 600 }}>
                                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div style={{ textAlign: 'right', minWidth: 90 }}>
                                  <div style={{ fontSize: 13, fontWeight: 900, color: isMissed ? '#FF3B30' : 'var(--neon-lime)', letterSpacing: 0.3 }}>
                                    {isMissed ? '-' : '+'}{Number(item.amount_bnb || 0).toFixed(5)} BNB
                                  </div>
                                  {item.amount_usd != null && (
                                    <div style={{ fontSize: 11, fontWeight: 700, color: isMissed ? 'rgba(255,59,48,0.6)' : '#4FC3F7', marginTop: 2 }}>
                                      ≈ ${Number(item.amount_usd).toFixed(2)}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      ))}

                      {sortedDays.length > visibleDays && (
                        <button
                          onClick={() => setVisibleDays(prev => prev + 7)}
                          style={{
                            width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)',
                            borderRadius: 16, padding: '16px', color: '#4FC3F7', fontSize: 11, fontWeight: 900,
                            letterSpacing: 1, cursor: 'pointer', marginTop: 10, marginBottom: 40
                          }}>
                          LOAD PREVIOUS DAYS ({sortedDays.length - visibleDays} LEFT)
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </AnimatePresence>
          <div style={{ height: 40 }} /> {/* Spacer */}
        </div>
      )}

      {/* ── Welcome Bonus Modal ── */}
      <AnimatePresence>
        {initialLoaded && !claimedMilestones?.includes('signup_bonus') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
            }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              style={{
                width: '100%', maxWidth: 320, background: 'linear-gradient(135deg, #1A1A1A 0%, #0D0D0D 100%)',
                borderRadius: 28, border: '1px solid rgba(163,255,18,0.2)', padding: '32px 24px',
                textAlign: 'center', position: 'relative', overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(163,255,18,0.1)'
              }}
            >
              {/* Decorative elements */}
              <div style={{ position: 'absolute', top: -40, right: -40, width: 100, height: 100, background: 'radial-gradient(circle, rgba(163,255,18,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
              
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎁</div>
              
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 8, letterSpacing: -0.5 }}>Welcome Bonus!</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: 24 }}>
                Welcome to AIPCore! Here is a special starter gift to kickstart your mining journey.
              </p>
              
              <div style={{ 
                background: 'rgba(163,255,18,0.05)', borderRadius: 20, padding: '20px 10px', 
                border: '1px dashed rgba(163,255,18,0.2)', marginBottom: 28 
              }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--neon-lime)', letterSpacing: 1.5, marginBottom: 4 }}>YOU RECEIVE</div>
                <div style={{ fontSize: 36, fontWeight: 950, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ color: '#FFD700' }}>$AIP</span> 100
                </div>
              </div>

              <button
                disabled={isBonusClaiming}
                onClick={async () => {
                  if (isBonusClaiming) return;
                  setIsBonusClaiming(true);
                  try {
                    const res = await claimSignupBonusAction();
                    if (res?.success) {
                      toast.success('100 $AIP Bonus Claimed! 🚀', { duration: 4000 });
                    }
                  } catch (err) {
                    toast.error(err.message || 'Failed to claim bonus');
                  } finally {
                    setIsBonusClaiming(false);
                  }
                }}
                style={{
                  width: '100%', background: 'var(--neon-lime)', border: 'none', borderRadius: 16,
                  padding: '16px', fontSize: 13, fontWeight: 950, color: '#000', cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(163,255,18,0.3)', transition: 'transform 0.2s',
                  opacity: isBonusClaiming ? 0.6 : 1
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {isBonusClaiming ? 'CLAIMING...' : 'CLAIM GIFT NOW'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
