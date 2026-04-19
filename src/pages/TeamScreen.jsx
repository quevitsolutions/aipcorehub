import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { useContract } from '../hooks/useContract.js';
import { shortAddr } from '../utils/format.js';
import { api } from '../services/api.js';

const TIER_COLORS = ['#A3FF12','#FFD700','#FF9800','#F44336','#E91E63','#9C27B0','#673AB7','#3F51B5','#2196F3','#00BCD4','#009688','#4CAF50','#8BC34A','#CDDC39','#FFEB3B','#FF9800','#FF5722','#795548'];

function TierBadge({ tier }) {
  const t = Number(tier) || 0;
  const color = TIER_COLORS[t - 1] || '#888';
  return (
    <span style={{
      background: color,
      color: t <= 2 ? '#000' : '#fff',
      fontSize: '8px', fontWeight: 900, padding: '2px 6px',
      borderRadius: '4px', letterSpacing: '0.5px'
    }}>T{t}</span>
  );
}

function NodeBadge({ nodeId }) {
  if (!nodeId || Number(nodeId) <= 0) return null;
  return (
    <span style={{
      background: 'rgba(79,195,247,0.15)',
      color: '#4FC3F7',
      border: '1px solid rgba(79,195,247,0.3)',
      fontSize: '8px', fontWeight: 900, padding: '2px 6px',
      borderRadius: '4px'
    }}>#{nodeId}</span>
  );
}

function MemberCard({ m, index, total }) {
  const rawJoin = m.joined_at || m.joinedAt || m.created_at;
  let dateStr = '—';
  if (rawJoin) {
    let dateObj;
    if (typeof rawJoin === 'string' && rawJoin.includes('T')) {
      // standard DB ISO String
      dateObj = new Date(rawJoin);
    } else {
      // raw epoch timestamp from blockchain
      dateObj = new Date(Number(rawJoin) * 1000);
    }
    if (!isNaN(dateObj.getTime())) {
      dateStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${String(dateObj.getFullYear()).slice(-2)}`;
    }
  }

  const wallet = m.wallet_address || m.wallet || '';
  const teamSize = Number(m.team_size || m.sub_referral_team || 0);
  const directs = Number(m.direct_count || 0);
  const isActive = m.node_tier > 0 || m.node_active === true;
  const isFree = Number(m.node_tier || 0) === 0;

  // Trial calculations
  const trialDays = m.trial_days_left !== undefined ? m.trial_days_left : 30;
  const aipBalance = parseFloat(m.local_reward || 0).toFixed(1);

  return (
    <div style={{
      padding: '12px 0',
      borderBottom: index < total - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
      display: 'flex', flexDirection: 'column', gap: '10px'
    }}>
      {/* Row 1: Wallet + Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: isActive ? '#A3FF12' : isFree ? '#FF9800' : '#FF5252',
            boxShadow: isActive ? '0 0 6px #A3FF12' : 'none',
            flexShrink: 0
          }} />
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>
            {shortAddr(wallet)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isFree && (
             <span style={{ fontSize: '9px', color: trialDays <= 5 ? '#FF5252' : '#FF9800', fontWeight: 700 }}>
               {trialDays > 0 ? `${trialDays}d left` : 'EXPIRED'}
             </span>
          )}
          <span style={{ fontSize: '9px', color: '#666', fontWeight: 600 }}>{dateStr}</span>
        </div>
      </div>

      {/* Row 2: Badges & Coins */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <TierBadge tier={m.node_tier || m.tier} />
          <NodeBadge nodeId={m.node_id || m.nodeId} />
          {m.is_direct && (
            <span style={{ background: 'rgba(255, 215, 0, 0.15)', color: '#FFD700', border: '1px solid rgba(255, 215, 0, 0.4)', fontSize: '8px', fontWeight: 900, padding: '2px 8px', borderRadius: '4px' }}>DIRECT</span>
          )}
        </div>
        
        {isFree && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,163,18,0.05)', padding: '2px 8px', borderRadius: '10px' }}>
            <span style={{ fontSize: '10px', color: '#FFF' }}>💎</span>
            <span style={{ fontSize: '10px', fontWeight: 900, color: '#FFD700' }}>{aipBalance}</span>
          </div>
        )}
      </div>

      {/* Row 3: Stats */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 900, color: '#A3FF12' }}>{directs}</div>
          <div style={{ fontSize: '7px', color: '#888', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>Directs</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 900, color: '#4FC3F7' }}>{teamSize}</div>
          <div style={{ fontSize: '7px', color: '#888', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>Sub Team</div>
        </div>
        <div style={{ flex: 1.5, background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', fontWeight: 900, color: '#FF5252', fontFamily: 'monospace' }}>
             {isFree ? `POTENTIAL: ~${(teamSize * 0.0025).toFixed(3)} BNB` : 'ACTIVATED'}
          </div>
          <div style={{ fontSize: '7px', color: '#888', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>Revenue</div>
        </div>
      </div>
    </div>
  );
  );
}

export default function TeamScreen() {
  const { isConnected, nodeId, directRefs, teamSize, walletAddress } = useGameStore();
  const { fetchTeamCounts, fetchMatrixCounts, fetchTeamLevelMembers, fetchDirectMembers } = useContract();

  const [dualCounts, setDualCounts] = useState({
    referral: new Array(18).fill(0),
    matrix: new Array(18).fill(0)
  });
  const [rpcMatrixCounts, setRpcMatrixCounts] = useState(new Array(18).fill(0));
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState(null);
  const [levelMembers, setLevelMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [activeTab, setActiveTab] = useState('matrix');
  const [directMembers, setDirectMembers] = useState([]);
  const [loadingDirect, setLoadingDirect] = useState(false);
  const [referralStats, setReferralStats] = useState({ total: 0, activated: 0, conversionRate: '0.0', potentialBnb: '0.00' });
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if ((activeTab === 'direct' || activeTab === 'free') && walletAddress && directMembers.length === 0) {
      setLoadingDirect(true);
      
      const loadDirects = async () => {
        try {
          // 1. Fetch live directly from Contract
          let rpcDirects = [];
          if (nodeId && Number(nodeId) > 0 && fetchDirectMembers) {
            rpcDirects = await fetchDirectMembers(nodeId).catch(() => []);
          }

          // 2. Fetch from DB config
          const dbData = await api.fetchReferralList(walletAddress).catch(() => []);
          const dbList = Array.isArray(dbData) ? dbData : dbData.referrals || [];

          // 3. Merge: Blockchain overrides DB stats for activated users
          const merged = [...dbList];
          
          rpcDirects.forEach(rpcUser => {
            const index = merged.findIndex(u => u.wallet_address?.toLowerCase() === rpcUser.wallet_address.toLowerCase());
            if (index >= 0) {
              merged[index] = { ...merged[index], ...rpcUser, is_direct: true };
            } else {
              merged.push({ ...rpcUser, is_direct: true });
            }
          });

          // Deduplicate and mark all direct
          const finalList = merged.map((m) => ({ ...m, is_direct: true }));

          setDirectMembers(finalList);
          setLoadingDirect(false);
        } catch (err) {
          console.error("Failed to merge direct team:", err);
          setLoadingDirect(false);
        }
      };

      loadDirects();
    }
  }, [activeTab, walletAddress, nodeId, fetchDirectMembers]);

  useEffect(() => {
    const loadStats = async () => {
      if (!walletAddress) return;
      setLoadingCounts(true);
      try {
        // Force-repair tree links first so direct/team counts are accurate
        // (bypasses the server-side 30s throttle for explicit user screen loads)
        fetch('/api/network/force-repair', { method: 'POST' }).catch(() => {});

        const data = await api.fetchNetworkCounts(walletAddress);
        const dc = {
          referral: data.referralCounts || new Array(18).fill(0),
          matrix: data.matrixCounts || new Array(18).fill(0)
        };
        setDualCounts(dc);

        // Fetch referral conversion stats
        setLoadingStats(true);
        const stats = await api.fetchReferralStats(walletAddress).catch(() => null);
        if (stats) setReferralStats(stats);
        setLoadingStats(false);

        // FALLBACK: If DB matrix counts are all 0, fetch directly from contract
        const dbMatrixTotal = (dc.matrix || []).reduce((a,b) => a+b, 0);
        if (dbMatrixTotal === 0 && nodeId && Number(nodeId) > 0) {
          console.log("⚡ DB matrix empty, fetching live from RPC...");
          const liveMatrix = await fetchMatrixCounts(nodeId);
          setRpcMatrixCounts(liveMatrix);
        }
      } catch (err) {
        console.error('Failed to load network counts', err);
        // On API error, try full RPC fallback
        if (nodeId) {
          const liveMatrix = await fetchMatrixCounts(nodeId).catch(() => new Array(18).fill(0));
          setRpcMatrixCounts(liveMatrix);
        }
      }
      setLoadingCounts(false);
    };

    if (isConnected && walletAddress) {
      loadStats();
    }
  }, [isConnected, walletAddress, nodeId]);

  const toggleLevel = async (levelIndex) => {
    if (expandedLevel === levelIndex) {
      setExpandedLevel(null);
      return;
    }
    setExpandedLevel(levelIndex);
    setLevelMembers([]);

    const hasCount = (dualCounts.matrix[levelIndex] > 0 || dualCounts.referral[levelIndex] > 0 || (rpcMatrixCounts[levelIndex] || 0) > 0);
    if (hasCount) {
      setLoadingMembers(true);
      try {
        if (activeTab === 'matrix') {
          // Matrix Mode: Use Contract + DB Sync
          const rpcMembers = await fetchTeamLevelMembers(nodeId, levelIndex);
          const mappedMembers = (rpcMembers || []).map(m => ({
            wallet_address: m.wallet,
            node_id: m.nodeId,
            node_tier: m.tier,
            joined_at: m.joinedAt,
            team_size: Number(m.totalMatrixNodes || 0),
            direct_count: Number(m.directNodes || 0),
            node_active: true,
            is_direct: false
          }));
          setLevelMembers(mappedMembers);
          setLoadingMembers(false);

          // Background sync
          if (mappedMembers.length > 0) {
            api.syncNetworkMembers(mappedMembers, nodeId);
            const dbMembers = await api.fetchNetworkLevelMembers(walletAddress, levelIndex + 1);
            if (dbMembers && dbMembers.length > 0) {
              setLevelMembers(dbMembers.map(m => ({ ...m, team_size: Number(m.team_size || 0), direct_count: Number(m.direct_count || 0) })));
            }
          }
        } else if (activeTab === 'free_tree' || activeTab === 'free') {
          // Referral Mode: Use API recursive fetch
          const members = await api.fetchReferralLevelMembers(walletAddress, levelIndex + 1);
          setLevelMembers(members);
          setLoadingMembers(false);
        }
      } catch (err) {
        console.error('Total fetch failure:', err);
        setLevelMembers([]);
        setLoadingMembers(false);
      }
    }
  };

  if (!isConnected) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px' }}>MY NETWORK</h2>
        <p style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 600 }}>Please connect your wallet to view your team.</p>
      </div>
    );
  }

  // Direct sponsor count (from store or referral[0])
  const calculatedDirects = directRefs || dualCounts.referral[0] || 0;
  const matrixTotal = dualCounts.matrix.reduce((a,b) => a+b, 0);
  const calculatedTotal = matrixTotal || (teamSize || 0);
  
  // LEVEL DATA: Matrix-only. Priority: DB matrix > Live RPC fallback
  const levelData = new Array(18).fill(0).map((_, i) => dualCounts.matrix[i] || rpcMatrixCounts[i] || 0);
  // Max capacity per level in binary matrix: 2^(level)
  const maxCapacity = (level) => Math.pow(2, level);

  // Split directs into activated and free (t0 = Free)
  const activatedDirects = directMembers.filter(m => Number(m.node_tier || m.tier || 0) > 0);
  const freeDirects = directMembers.filter(m => Number(m.node_tier || m.tier || 0) === 0);

  const displayList = activeTab === 'direct' ? activatedDirects : freeDirects;
  const listTitle = activeTab === 'direct' ? `MY DIRECT REFERRALS (${activatedDirects.length})` : `FREE USERS (${freeDirects.length})`;

  return (
    <div className="page page-team" style={{ paddingBottom: '100px' }}>
      <div style={{ textAlign: 'center', padding: '10px 0 24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '6px' }}>MY NETWORK</h2>
        <div style={{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: '20px',
          background: 'rgba(79,195,247,0.1)',
          border: '1px solid rgba(79,195,247,0.2)'
        }}>
          <span style={{ fontSize: '10px', color: '#4FC3F7', fontWeight: 900, letterSpacing: '1px' }}>
            {calculatedTotal} MEMBERS TOTAL
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', padding: '0 16px 20px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <button 
          onClick={() => setActiveTab('matrix')}
          style={{ flexShrink: 0, padding: '10px 16px', borderRadius: '8px', background: activeTab === 'matrix' ? 'rgba(79,195,247,0.15)' : 'rgba(255,255,255,0.05)', color: activeTab === 'matrix' ? '#4FC3F7' : '#888', border: `1px solid ${activeTab === 'matrix' ? 'rgba(79,195,247,0.3)' : 'transparent'}`, fontSize: '10px', fontWeight: 800 }}>
          MATRIX
        </button>
        <button 
          onClick={() => setActiveTab('free')}
          style={{ flexShrink: 0, padding: '10px 16px', borderRadius: '8px', background: activeTab === 'free' ? 'rgba(255,152,0,0.15)' : 'rgba(255,255,255,0.05)', color: activeTab === 'free' ? '#FF9800' : '#888', border: `1px solid ${activeTab === 'free' ? 'rgba(255,152,0,0.3)' : 'transparent'}`, fontSize: '10px', fontWeight: 800 }}>
          FREE ({referralStats.total || 0})
        </button>
        <button 
          onClick={() => setActiveTab('direct')}
          style={{ flexShrink: 0, padding: '10px 16px', borderRadius: '8px', background: activeTab === 'direct' ? 'rgba(163,255,18,0.15)' : 'rgba(255,255,255,0.05)', color: activeTab === 'direct' ? '#A3FF12' : '#888', border: `1px solid ${activeTab === 'direct' ? 'rgba(163,255,18,0.3)' : 'transparent'}`, fontSize: '10px', fontWeight: 800 }}>
          MY DIRECTS ({activatedDirects.length})
        </button>
      </div>

      {/* Conversion Stats Dashboard */}
      <div style={{ padding: '0 16px 24px' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(255,152,0,0.1) 0%, rgba(255,82,82,0.1) 100%)',
          border: '1px solid rgba(255,152,0,0.2)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
             <div>
                <div style={{ fontSize: '10px', color: '#FF9800', fontWeight: 900, letterSpacing: '1px' }}>TEAM EFFICIENCY</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>{referralStats.conversionRate}%</div>
             </div>
             <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: '#FF5252', fontWeight: 900, letterSpacing: '1px' }}>MISSED OPPORTUNITY</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#FF5252' }}>~{referralStats.potentialBnb} BNB</div>
             </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
             <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '8px' }}>
                <div style={{ fontSize: '8px', color: '#888', fontWeight: 800 }}>FREE USERS</div>
                <div style={{ fontSize: '12px', fontWeight: 900, color: '#FF9800' }}>{referralStats.total - referralStats.activated}</div>
             </div>
             <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '8px' }}>
                <div style={{ fontSize: '8px', color: '#888', fontWeight: 800 }}>ACTIVATED</div>
                <div style={{ fontSize: '12px', fontWeight: 900, color: '#A3FF12' }}>{referralStats.activated}</div>
             </div>
          </div>

          <div style={{ fontSize: '9px', color: '#aaa', fontStyle: 'italic', textAlign: 'center' }}>
            * Potential earnings calculated across 18 referral levels. Activate to secure your spot!
          </div>
        </div>
      </div>

      {(activeTab === 'matrix' || activeTab === 'free') && (
        <div style={{ padding: '0 8px' }}>
          <div style={{ fontSize: '10px', fontWeight: 900, color: activeTab === 'matrix' ? '#4FC3F7' : '#FF9800', marginBottom: '12px', letterSpacing: '1.5px', textAlign: 'center' }}>
            {activeTab === 'matrix' ? 'BINARY MATRIX LEVELS' : 'REFERRAL TREE LEVELS (18 DEEP)'}
          </div>

          {loadingCounts ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#FFB74D', fontSize: '11px', fontWeight: 700 }}>
              LOADING NETWORK DATA...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18].map((level, index) => {
                const count = activeTab === 'matrix' ? (levelData[index] || 0) : (dualCounts.referral[index] || 0);
                const maxSlots = activeTab === 'matrix' ? maxCapacity(level) : '∞';
                const fillPct = activeTab === 'matrix' ? (maxSlots > 0 ? Math.min(100, Math.round((count / maxSlots) * 100)) : 0) : 0;
                const isExpanded = expandedLevel === index;
                const canClick = count > 0 || isExpanded;

                return (
                  <div key={level} style={{
                    borderRadius: '12px',
                    border: `1px solid ${isExpanded ? 'rgba(255,152,0,0.25)' : count > 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
                    background: isExpanded ? 'rgba(255,152,0,0.03)' : 'rgba(255,255,255,0.02)',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    opacity: count === 0 ? 0.45 : 1
                  }}>
                    {/* Level Header */}
                    <div
                      onClick={() => canClick && toggleLevel(index)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 16px', cursor: canClick ? 'pointer' : 'default'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '8px',
                          background: count > 0 ? (activeTab === 'matrix' ? 'rgba(79,195,247,0.15)' : 'rgba(255,152,0,0.15)') : 'rgba(255,255,255,0.05)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', fontWeight: 900,
                          color: count > 0 ? (activeTab === 'matrix' ? '#4FC3F7' : '#FF9800') : '#555'
                        }}>
                          {level}
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>Level {level}</div>
                          {activeTab === 'matrix' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                              <div style={{ width: '60px', height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ width: `${fillPct}%`, height: '100%', background: '#4FC3F7', borderRadius: '2px' }} />
                              </div>
                              <span style={{ fontSize: '8px', color: '#555', fontWeight: 700 }}>{count}/{maxSlots}</span>
                            </div>
                          ) : (
                            <div style={{ fontSize: '8px', color: '#666', fontWeight: 700, marginTop: '2px' }}>UNLIMITED WIDTH</div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          fontSize: '16px', fontWeight: 900,
                          color: count > 0 ? (activeTab === 'matrix' ? '#4FC3F7' : '#FF9800') : '#333'
                        }}>{count}</span>
                        {count > 0 && (
                          <div style={{
                            width: '20px', height: '20px', borderRadius: '50%',
                            background: activeTab === 'matrix' ? 'rgba(79,195,247,0.1)' : 'rgba(255,152,0,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transform: isExpanded ? 'rotate(90deg)' : 'none',
                            transition: 'transform 0.25s ease'
                          }}>
                            <span style={{ fontSize: '10px', color: activeTab === 'matrix' ? '#4FC3F7' : '#FF9800' }}>›</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '0 16px' }}>
                        {loadingMembers ? (
                          <div style={{ padding: '24px 0', textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', color: '#FFB74D', fontWeight: 800, letterSpacing: '1px' }}>EXPLORING HIERARCHY...</div>
                          </div>
                        ) : levelMembers.length === 0 ? (
                          <div style={{ padding: '24px 0', textAlign: 'center' }}>
                            <div style={{ fontSize: '8px', color: '#555', letterSpacing: '1px' }}>NO MEMBERS FOUND AT THIS DEPTH</div>
                          </div>
                        ) : (
                          <div>
                            {levelMembers.map((m, i) => (
                              <MemberCard key={i} m={m} index={i} total={levelMembers.length} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'direct' && (
        <div style={{ padding: '0 16px' }}>
          <div style={{ fontSize: '10px', fontWeight: 900, color: '#A3FF12', marginBottom: '16px', letterSpacing: '1.5px', textAlign: 'center' }}>
            MY DIRECT ACTIVATED REFERRALS
          </div>
          {loadingDirect ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
               <span style={{ fontSize: '11px', color: '#888' }}>LOADING...</span>
            </div>
          ) : activatedDirects.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
               <div style={{ fontSize: '12px', color: '#666' }}>No activated directs yet</div>
            </div>
          ) : (
            <div>
              {activatedDirects.map((m, i) => (
                <MemberCard 
                  key={i} 
                  m={{ ...m, is_direct: true, joined_at: m.created_at || m.joined_at }} 
                  index={i} 
                  total={activatedDirects.length} 
                />
              ))}
            </div>
          )}
        </div>
    </div>
  );
}
