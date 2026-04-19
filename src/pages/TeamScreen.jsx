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
  const joinedAt = m.joined_at || m.joinedAt;
  const date = joinedAt ? new Date(joinedAt * 1000) : null;
  const dateStr = date ? `${date.getDate()}/${date.getMonth() + 1}/${String(date.getFullYear()).slice(-2)}` : '—';
  const wallet = m.wallet_address || m.wallet || '';
  const teamSize = Number(m.team_size || 0);
  const directs = Number(m.direct_count || 0);
  const isActive = m.node_active !== false;

  return (
    <div style={{
      padding: '12px 0',
      borderBottom: index < total - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
      display: 'flex', flexDirection: 'column', gap: '8px'
    }}>
      {/* Row 1: Wallet + Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: isActive ? '#A3FF12' : '#FF5252',
            boxShadow: isActive ? '0 0 6px #A3FF12' : 'none',
            flexShrink: 0
          }} />
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>
            {shortAddr(wallet)}
          </span>
        </div>
        <span style={{ fontSize: '9px', color: '#666', fontWeight: 600 }}>{dateStr}</span>
      </div>

      {/* Row 2: Badges */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <TierBadge tier={m.node_tier || m.tier} />
        <NodeBadge nodeId={m.node_id || m.nodeId} />
        {m.is_direct && (
          <span style={{ 
            background: 'rgba(255, 215, 0, 0.15)', 
            color: '#FFD700', 
            border: '1px solid rgba(255, 215, 0, 0.4)', 
            fontSize: '8px', 
            fontWeight: 900, 
            padding: '2px 8px', 
            borderRadius: '4px',
            letterSpacing: '0.5px',
            boxShadow: '0 0 10px rgba(255, 215, 0, 0.1)'
          }}>
            DIRECT
          </span>
        )}
        {isActive && (
          <span style={{ background: 'rgba(163,255,18,0.1)', color: '#A3FF12', border: '1px solid rgba(163,255,18,0.2)', fontSize: '8px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
            ACTIVE
          </span>
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
          <div style={{ fontSize: '10px', fontWeight: 900, color: '#FFD700', fontFamily: 'monospace' }}>{wallet.slice(0, 6)}...{wallet.slice(-4)}</div>
          <div style={{ fontSize: '7px', color: '#888', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>Address</div>
        </div>
      </div>
    </div>
  );
}

export default function TeamScreen() {
  const { isConnected, nodeId, directRefs, teamSize, walletAddress } = useGameStore();
  const { fetchTeamCounts, fetchMatrixCounts, fetchTeamLevelMembers } = useContract();

  const [dualCounts, setDualCounts] = useState({
    referral: new Array(18).fill(0),
    matrix: new Array(18).fill(0)
  });
  const [rpcMatrixCounts, setRpcMatrixCounts] = useState(new Array(18).fill(0));
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState(null);
  const [levelMembers, setLevelMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // --- NEW STATE: Tabs & Direct Team ---
  const [activeTab, setActiveTab] = useState('matrix');
  const [directMembers, setDirectMembers] = useState([]);
  const [loadingDirect, setLoadingDirect] = useState(false);

  useEffect(() => {
    if (activeTab === 'direct' && walletAddress && directMembers.length === 0) {
      setLoadingDirect(true);
      api.fetchReferralList(walletAddress)
        .then(data => {
          // If the API nests results (like Phase 2 stats), unwrap it
          const list = Array.isArray(data) ? data : data.referrals || [];
          setDirectMembers(list);
          setLoadingDirect(false);
        })
        .catch(err => {
          console.error("Failed to fetch direct team:", err);
          setLoadingDirect(false);
        });
    }
  }, [activeTab, walletAddress]);

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
        // 1. Primary: Fetch Live from Blockchain (Fast & 100% Accurate)
        const rpcMembers = await fetchTeamLevelMembers(nodeId, levelIndex);
        const mappedMembers = (rpcMembers || []).map(m => ({
          wallet_address: m.wallet,
          node_id: m.nodeId,
          node_tier: m.tier,
          joined_at: m.joinedAt,
          team_size: Number(m.totalMatrixNodes || 0),
          direct_count: Number(m.directNodes || 0),
          node_active: true,
          is_direct: false // We'll enrich this from the DB in a moment
        }));

        // Render RPC results immediately
        setLevelMembers(mappedMembers);
        setLoadingMembers(false);

        // 2. Background: Sync to DB Cache & Enrichment
        // This keeps the DB counts accurate for global stats
        try {
          // Sync RPC data to DB to ensure records exist
          if (mappedMembers.length > 0) {
            await api.syncNetworkMembers(mappedMembers, nodeId);
          }

          // Fetch enriched data (with 'is_direct' badges) from API
          const dbMembers = await api.fetchNetworkLevelMembers(walletAddress, levelIndex + 1);
          if (dbMembers && dbMembers.length > 0) {
            setLevelMembers(dbMembers.map(m => ({
              ...m,
              team_size: Number(m.team_size || 0),
              direct_count: Number(m.direct_count || 0)
            })));
          }
        } catch (bgErr) {
          console.warn("Background DB enrichment failed:", bgErr.message);
          // UI already shows RPC data, so we stay silent
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

      <div style={{ display: 'flex', gap: '8px', padding: '0 16px 20px' }}>
        <button 
          onClick={() => setActiveTab('matrix')}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', background: activeTab === 'matrix' ? 'rgba(79,195,247,0.15)' : 'rgba(255,255,255,0.05)', color: activeTab === 'matrix' ? '#4FC3F7' : '#888', border: `1px solid ${activeTab === 'matrix' ? 'rgba(79,195,247,0.3)' : 'transparent'}`, fontSize: '12px', fontWeight: 800 }}>
          MATRIX LEVELS
        </button>
        <button 
          onClick={() => setActiveTab('direct')}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', background: activeTab === 'direct' ? 'rgba(163,255,18,0.15)' : 'rgba(255,255,255,0.05)', color: activeTab === 'direct' ? '#A3FF12' : '#888', border: `1px solid ${activeTab === 'direct' ? 'rgba(163,255,18,0.3)' : 'transparent'}`, fontSize: '12px', fontWeight: 800 }}>
          DIRECT TEAM ({calculatedDirects})
        </button>
      </div>

      {activeTab === 'matrix' ? (
        <>
          <div style={{ fontSize: '10px', fontWeight: 900, color: '#4FC3F7', marginBottom: '12px', letterSpacing: '1.5px', paddingLeft: '2px', textAlign: 'center' }}>
            BINARY MATRIX LEVELS
          </div>

          {loadingCounts ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#FFB74D', fontSize: '11px', fontWeight: 700 }}>
              LOADING NETWORK DATA...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18].map((level, index) => {
                const count = levelData[index] || 0;
                const maxSlots = maxCapacity(level); // 2, 4, 8, 16...
                const fillPct = maxSlots > 0 ? Math.min(100, Math.round((count / maxSlots) * 100)) : 0;
                const isExpanded = expandedLevel === index;
                const canClick = count > 0 || isExpanded;

                return (
                  <div key={level} style={{
                    borderRadius: '12px',
                    border: `1px solid ${isExpanded ? 'rgba(163,255,18,0.25)' : count > 0 ? 'rgba(79,195,247,0.1)' : 'rgba(255,255,255,0.04)'}`,
                    background: isExpanded ? 'rgba(163,255,18,0.03)' : 'rgba(255,255,255,0.02)',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s',
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
                          background: count > 0 ? 'rgba(163,255,18,0.15)' : 'rgba(255,255,255,0.05)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', fontWeight: 900,
                          color: count > 0 ? '#A3FF12' : '#555'
                        }}>
                          {level}
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>Level {level}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            {/* Progress bar */}
                            <div style={{ width: '60px', height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: `${fillPct}%`, height: '100%', background: fillPct >= 100 ? '#A3FF12' : '#4FC3F7', borderRadius: '2px', transition: 'width 0.4s ease' }} />
                            </div>
                            <span style={{ fontSize: '8px', color: '#555', fontWeight: 700 }}>{count}/{maxSlots}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          fontSize: '16px', fontWeight: 900,
                          color: count >= maxSlots ? '#A3FF12' : count > 0 ? '#4FC3F7' : '#333'
                        }}>{count}</span>
                        {count > 0 && (
                          <div style={{
                            width: '20px', height: '20px', borderRadius: '50%',
                            background: 'rgba(163,255,18,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transform: isExpanded ? 'rotate(90deg)' : 'none',
                            transition: 'transform 0.25s ease'
                          }}>
                            <span style={{ fontSize: '10px', color: '#A3FF12' }}>›</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expanded Members */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '0 16px' }}>
                        {loadingMembers ? (
                          <div style={{ padding: '24px 0', textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', color: '#FFB74D', fontWeight: 800, letterSpacing: '1px' }}>FETCHING OPERATORS...</div>
                          </div>
                        ) : levelMembers.length === 0 ? (
                          <div style={{ padding: '24px 0', textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', color: '#FFD54F', fontWeight: 800, marginBottom: '4px' }}>⏳ SYNCING FROM BLOCKCHAIN</div>
                            <div style={{ fontSize: '8px', color: '#555', letterSpacing: '1px' }}>FIRST SYNC IN PROGRESS</div>
                          </div>
                        ) : (
                          <div>
                            {/* Column Headers */}
                            <div style={{
                              display: 'flex', justifyContent: 'space-between',
                              padding: '10px 0 8px',
                              borderBottom: '1px solid rgba(255,255,255,0.05)',
                              marginBottom: '4px'
                            }}>
                              <span style={{ fontSize: '8px', color: '#FFD700', fontWeight: 900, letterSpacing: '1px' }}>OPERATOR</span>
                              <div style={{ display: 'flex', gap: '16px' }}>
                                <span style={{ fontSize: '8px', color: '#FFD700', fontWeight: 900, width: '45px', textAlign: 'center' }}>DIRECT</span>
                                <span style={{ fontSize: '8px', color: '#4FC3F7', fontWeight: 900, width: '45px', textAlign: 'center' }}>TEAM</span>
                              </div>
                            </div>

                            {levelMembers.map((m, i) => (
                              <MemberCard key={i} m={m} index={i} total={levelMembers.length} />
                            ))}

                            {levelMembers.length >= 100 && (
                              <div style={{ padding: '10px 0', textAlign: 'center', fontSize: '9px', color: '#FF5252', fontStyle: 'italic' }}>
                                Showing latest 100 members
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div style={{ padding: '0 16px' }}>
          <div style={{ fontSize: '10px', fontWeight: 900, color: '#A3FF12', marginBottom: '16px', letterSpacing: '1.5px', textAlign: 'center' }}>
            MY DIRECT REFERRALS ({directMembers.length})
          </div>
          {loadingDirect ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#FFB74D', fontSize: '11px', fontWeight: 700 }}>
              LOADING DIRECT TEAM...
            </div>
          ) : directMembers.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
               <div style={{ fontSize: '32px', marginBottom: '10px' }}>👥</div>
               <div style={{ fontSize: '12px', color: '#fff', fontWeight: 800 }}>No directs yet</div>
               <div style={{ fontSize: '10px', color: '#666', marginTop: '6px' }}>Share your link to grow your team!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {directMembers.map((m, i) => {
                const rowNodeId   = Number(m.node_id || 0);
                const rowActive   = m.node_active === true;
                const rowTier     = Number(m.node_tier || 0);
                const isActivated = rowNodeId > 0 || rowActive || rowTier > 0;
                
                const joinedAtStr = m.created_at || m.joined_at;
                const d = joinedAtStr ? new Date(joinedAtStr) : null;
                const dateStr = d ? `${d.getDate()}/${d.getMonth()+1}/${String(d.getFullYear()).slice(-2)}` : '—';
                
                return (
                  <div key={i} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isActivated ? '#A3FF12' : '#FF5252', boxShadow: isActivated ? '0 0 6px #A3FF12' : 'none' }} />
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>
                          {shortAddr(m.wallet_address || m.wallet || '')}
                        </span>
                      </div>
                      <span style={{ fontSize: '10px', color: '#888', fontWeight: 700 }}>
                        {dateStr}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <TierBadge tier={rowTier} />
                      {rowNodeId > 0 && <NodeBadge nodeId={rowNodeId} />}
                      {isActivated && <span style={{ background: 'rgba(163,255,18,0.1)', color: '#A3FF12', border: '1px solid rgba(163,255,18,0.2)', fontSize: '8px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>ACTIVE</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
