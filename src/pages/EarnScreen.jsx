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
        try { const ref = await contract.nodeId(referrerId); if (Number(ref) > 0) sponsorNodeId = ref; } catch {}
      }
      const tierCost = await contract.getTierCost(0);
      toast.loading('Confirm transaction...', { id: 'reg' });
      const tx = await contract.createNode(sponsorNodeId, { value: tierCost });
      toast.loading(`Tx sent: ${tx.hash.slice(0,10)}...`, { id: 'reg' });
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
        style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 20px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
        Learn More →
      </button>
    </div>
  );
}

export default function EarnScreen() {
  const {
    walletAddress, localReward, nodeTier, isPremium,
    hasNode, lastClaimTime, teamHistory, isHistoryLoading,
    claimMined, setActiveTab, addLocalReward, fetchTeamHistory,
    isFreeActive, createdAt, globalHistory, fetchGlobalHistory
  } = useGameStore();

  const [view, setView] = useState('mining'); // 'mining' | 'history'
  const [historyMode, setHistoryMode] = useState('personal'); // 'personal' | 'global'
  const [isExploding, setIsExploding] = useState(false);
  const [displayReward, setDisplayReward] = useState(localReward);
  const [claimedTasks, setClaimedTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aip-tasks') || '[]'); } catch { return []; }
  });

  // Keep displayReward in sync with store (animates upward only)
  useEffect(() => {
    setDisplayReward(localReward);
  }, [localReward]);

  const hourlyBase = hasNode ? (nodeTier >= 2 ? 200 : 100) : 10;
  const multiplier = isPremium ? 2 : 1;
  const ratePerHour = hourlyBase * multiplier;
  
  const localMined = useLocalMining(lastClaimTime, ratePerHour, hasNode || isFreeActive);

  // Live timer — re-renders every second
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const now = Date.now();
  const elapsed = now - lastClaimTime;
  const timeRemaining = Math.max(0, MAX_SESSION - elapsed);
  const maturity = hasNode ? Math.min(1, elapsed / MAX_SESSION) : 0;

  const formatTime = (ms) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  const onClaim = async () => {
    if (localMined <= 0) return;
    setIsExploding(true);

    // Tell store to request an authoritative claim from postgres
    await claimMined();

    toast.success(`🥚 Hatch claim completed via authoritative ledger!`, { duration: 3000 });
    setTimeout(() => setIsExploding(false), 800);

    if (!hasNode) {
      setTimeout(() => {
        toast('Activate an AIPCore Node to earn real BNB, 10x more coins, and massive pool rewards!', {
          icon: '💎',
          duration: 6000,
          style: { border: '1px solid var(--neon-lime)' }
        });
      }, 800);
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

  const displayTier = Math.max(1, nodeTier || 1);
  const daysLeft = createdAt ? Math.max(0, 30 - Math.floor((now - new Date(createdAt).getTime()) / (24 * 3600000))) : 0;
  const isExpired = !hasNode && daysLeft <= 0;

  // Render the gate ONLY if we have no node AND we aren't a free active member
  if (!hasNode && !isFreeActive && !isExpired) {
    return <RegistrationGate setActiveTab={setActiveTab} />;
  }

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
              color: view === 'mining' ? '#000' : 'rgba(255,255,255,0.5)',
              transition: 'all 0.2s'
            }}>⛏️ MINING</button>
          <button 
            onClick={() => { setView('history'); fetchTeamHistory(); }}
            style={{ 
              padding: '6px 16px', borderRadius: 10, border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer',
              background: view === 'history' ? 'var(--neon-lime)' : 'transparent',
              color: view === 'history' ? '#000' : 'rgba(255,255,255,0.5)',
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
          {/* ── Balance ── */}
          <div className="balance-container" style={{ margin: '4px 0 8px' }}>
            <div className="balance-main">
              <img src="/assets/gold_coin.png" className="balance-coin" style={{ width: 40, clipPath: 'circle(50%)' }} alt="coin" />
              <span className="balance-value" style={{ fontSize: 40 }}>
                {Math.floor(displayReward).toLocaleString('en-US')}
              </span>
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

              {/* EGG */}
              <div style={{ position: 'relative', width: 210, height: 210, zIndex: 10 }}>
                <img src="/assets/egg_orange.png"
                  style={{ 
                    width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'screen', clipPath: 'circle(48% at 50% 50%)', 
                    filter: isExpired ? 'grayscale(1) brightness(0.5)' : `drop-shadow(0 0 ${20 * maturity}px rgba(203,255,1,0.5))` 
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

              {/* BOOST pill - Only for node owners */}
              {hasNode && (
                <motion.div onClick={() => setActiveTab('mine')}
                  animate={{ boxShadow: ['0 0 8px rgba(203,255,1,0.3)', '0 0 22px rgba(203,255,1,0.7)', '0 0 8px rgba(203,255,1,0.3)'] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  style={{ marginTop: 8, background: 'var(--neon-lime)', borderRadius: 40, padding: '7px 20px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', zIndex: 20 }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#000', letterSpacing: 1 }}>BOOST</span>
                  <span style={{ fontSize: 11, fontWeight: 900, color: 'rgba(0,0,0,0.6)' }}>T{displayTier}→{displayTier + 1} ⬆</span>
                </motion.div>
              )}

              {!hasNode && isFreeActive && (
                <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.05)', padding: '6px 16px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--neon-lime)' }}>{daysLeft} DAYS TRIAL LEFT</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Claim Module ── */}
          <div style={{ flexShrink: 0, padding: '12px 0 0px', background: 'linear-gradient(to top, var(--bg-dark) 60%, transparent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.45)', letterSpacing: 1 }}>SESSION ENDS IN</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>{formatTime(timeRemaining)}</span>
            </div>

            <button
              onClick={onClaim}
              disabled={localMined <= 0}
              style={{
                width: '100%', background: localMined > 0 ? 'var(--neon-lime)' : 'rgba(255,255,255,0.08)',
                border: 'none', borderRadius: 20, padding: '18px', cursor: localMined > 0 ? 'pointer' : 'default',
                boxShadow: localMined > 0 ? '0 0 30px rgba(203,255,1,0.3)' : 'none',
                transition: 'all 0.3s'
              }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: localMined > 0 ? '#000' : 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>
                  {maturity >= 1 ? '🥚 READY TO HATCH' : 'COLLECT MINED'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <img src="/assets/gold_coin.png" style={{ width: 14, clipPath: 'circle(50%)' }} alt="coin" />
                  <span style={{ fontSize: 15, fontWeight: 900, color: localMined > 0 ? '#000' : 'rgba(255,255,255,0.3)' }}>
                    {Math.floor(localMined).toLocaleString('en-US')}
                  </span>
                </div>
              </div>
            </button>
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
                  color: historyMode === 'personal' ? '#000' : 'rgba(255,255,255,0.5)'
                }}
              >MY TEAM</div>
              <div 
                onClick={() => { setHistoryMode('global'); fetchGlobalHistory(); }}
                style={{
                  padding: '6px 14px', borderRadius: 16, fontSize: 11, fontWeight: 900, cursor: 'pointer',
                  background: historyMode === 'global' ? 'var(--neon-lime)' : 'transparent',
                  color: historyMode === 'global' ? '#000' : 'rgba(255,255,255,0.5)'
                }}
              >LIVE FEED 🌍</div>
            </div>

            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', paddingRight: 8 }} onClick={() => historyMode === 'personal' ? fetchTeamHistory() : fetchGlobalHistory()}>🔄</span>
          </div>

          <AnimatePresence mode="wait">
            {isHistoryLoading ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
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
                {Object.entries((historyMode === 'personal' ? teamHistory : globalHistory).reduce((acc, item) => {
                  const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                  if (!acc[dateStr]) acc[dateStr] = [];
                  acc[dateStr].push(item);
                  return acc;
                }, {})).map(([dateLabel, items], groupIdx) => (
                  <div key={dateLabel} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Day divider */}
                    <div style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, paddingLeft: 4, textTransform: 'uppercase' }}>
                      {dateLabel}
                    </div>

                    {items.map((item, idx) => {
                      const getIcon = (type) => {
                        if (item.is_missed) return '⚠️';
                        switch(type) {
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
                          transition={{ delay: (groupIdx * 0.1) + (idx * 0.05) }}
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
                                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>To {item.wallet_address}</span>
                                )}
                                {historyMode === 'personal' && item.from_node_id > 0 && (
                                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>From #{item.from_node_id}</span>
                                )}
                                {item.tier > 0 && (
                                  <span style={{ fontSize: 9, color: 'var(--neon-lime)', opacity: 0.8 }}>Tier {item.tier}</span>
                                )}
                                {item.layer > 0 && (
                                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>Lvl {item.layer}</span>
                                )}
                                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
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
              </div>
            )}
          </AnimatePresence>
          <div style={{ height: 40 }} /> {/* Spacer */}
        </div>
      )}
    </div>
  );
}
