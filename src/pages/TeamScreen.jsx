import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { shortAddr } from '../utils/format.js';
import { api } from '../services/api.js';

export default function TeamScreen() {
  const { isConnected, directRefs, teamSize, walletAddress } = useGameStore();

  const [dualCounts, setDualCounts] = useState({
    referral: new Array(18).fill(0),
    matrix: new Array(18).fill(0)
  });
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState(null);
  const [levelMembers, setLevelMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      if (!walletAddress) return;
      setLoadingCounts(true);
      try {
        const data = await api.fetchNetworkCounts(walletAddress);
        setDualCounts({
          referral: data.referralCounts || new Array(18).fill(0),
          matrix: data.matrixCounts || new Array(18).fill(0)
        });
      } catch (err) {
        console.error('Failed to load network stats from API Bridge:', err);
      }
      setLoadingCounts(false);
    };

    if (isConnected && walletAddress) {
      loadStats();
    }
  }, [isConnected, walletAddress]);

  const toggleLevel = async (levelIndex) => {
    if (expandedLevel === levelIndex) {
      setExpandedLevel(null);
      return;
    }

    setExpandedLevel(levelIndex);
    setLevelMembers([]);

    if (dualCounts.referral[levelIndex] > 0) {
      setLoadingMembers(true);
      try {
        const members = await api.fetchNetworkLevelMembers(walletAddress, levelIndex);
        setLevelMembers(members);
      } catch (err) {
        console.error('API member fetch failed:', err);
      }
      setLoadingMembers(false);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const date = new Date(ts * 1000);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  if (!isConnected) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px' }}>MY NETWORK</h2>
        <p style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 600 }}>Please connect your wallet to view your team.</p>
      </div>
    );
  }

  const calculatedDirects = dualCounts.referral[0] || (directRefs || 0);
  const calculatedTotal = dualCounts.matrix.reduce((acc, curr) => acc + curr, 0) || (teamSize || 0);
  const levelData = dualCounts.referral;

  return (
    <div className="page page-team" style={{ paddingBottom: '100px' }}>
      <div style={{ textAlign: 'center', padding: '10px 0 30px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px' }}>MY NETWORK</h2>
        <p style={{ fontSize: '12px', color: '#FFB74D', fontWeight: 700, letterSpacing: '0.05em' }}>
          LEVEL WISE TEAM BREAKDOWN
        </p>
      </div>

      {/* Network Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <div className="booster-card" style={{ margin: 0, padding: '16px', alignItems: 'center', border: '1px solid rgba(163, 255, 18, 0.1)' }}>
          <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--neon-lime)' }}>{calculatedDirects}</span>
          <span style={{ fontSize: '10px', color: '#FFD700', fontWeight: 800, marginTop: '4px' }}>DIRECT COUNT</span>
        </div>
        <div className="booster-card" style={{ margin: 0, padding: '16px', alignItems: 'center', border: '1px solid rgba(163, 255, 18, 0.1)' }}>
          <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--neon-lime)' }}>{calculatedTotal}</span>
          <span style={{ fontSize: '10px', color: '#A3FF12', fontWeight: 800, marginTop: '4px' }}>TEAM MATRIX COUNT</span>
        </div>
      </div>

      {/* Level List */}
      <h3 style={{ fontSize: '13px', fontWeight: 900, color: '#4FC3F7', marginBottom: '16px', paddingLeft: '4px' }}>TEAM BY LEVEL</h3>

      {loadingCounts ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#FF5252', fontSize: '12px', fontWeight: 700 }}>
          LOADING NETWORK DATA...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((level, index) => {
            const count = levelData[index];
            const isExpanded = expandedLevel === index;
            const canClick = count > 0 || isExpanded;

            return (
              <div
                key={level}
                className="booster-card"
                style={{
                  margin: 0,
                  padding: '0',
                  flexDirection: 'column',
                  cursor: canClick ? 'pointer' : 'default',
                  opacity: count === 0 ? 0.6 : 1
                }}
              >
                {/* Level Header Row */}
                <div
                  onClick={() => canClick && toggleLevel(index)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    width: '100%'
                  }}
                >
                  <span style={{ fontSize: '15px', fontWeight: 800 }}>Level {level}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 900, color: count > 0 ? 'var(--neon-lime)' : 'var(--text-dim)' }}>
                      {count} Users
                    </span>
                    {count > 0 && (
                      <span style={{ fontSize: '12px', color: '#FFFFFF', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                        〉
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Member Details */}
                {isExpanded && (
                  <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    padding: '0px 16px',
                    background: 'rgba(0,0,0,0.2)'
                  }}>
                    {loadingMembers ? (
                      <div style={{ padding: '20px 0', textAlign: 'center', fontSize: '11px', color: '#FFB74D', fontWeight: 700 }}>
                        FETCHING MEMBERS...
                      </div>
                    ) : (
                      <div style={{ padding: '12px 0' }}>
                        {/* Member Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#FFD700', fontWeight: 800, paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '8px' }}>
                          <span style={{ flex: 1.5 }}>NODE ID / WALLET</span>
                          <span style={{ width: '60px', textAlign: 'center' }}>TEAM</span>
                          <span style={{ width: '80px', textAlign: 'right' }}>JOINED</span>
                        </div>

                        {levelMembers.length === 0 ? (
                          <div style={{ padding: '10px 0', textAlign: 'center', fontSize: '12px', color: '#A3FF12' }}>No members found.</div>
                        ) : (
                          levelMembers.map((m, i) => (
                            <div key={i} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0',
                              borderBottom: i < levelMembers.length - 1 ? '1px rgba(255,255,255,0.03) solid' : 'none'
                            }}>
                              <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 800, color: '#FFFFFF' }}>
                                  {shortAddr(m.wallet_address || m.wallet)}
                                </span>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <span style={{ background: '#FFD700', color: '#000', fontSize: '9px', fontWeight: 900, padding: '1px 5px', borderRadius: '4px' }}>
                                    T{m.node_tier || m.tier}
                                  </span>
                                  <span style={{ background: '#4FC3F7', color: '#000', fontSize: '9px', fontWeight: 900, padding: '1px 5px', borderRadius: '4px' }}>
                                    Node #{m.node_id || m.nodeId}
                                  </span>
                                </div>
                              </div>

                              <div style={{ width: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--neon-lime)' }}>{m.team_size || 0}</span>
                                <span style={{ fontSize: '7px', fontWeight: 800, color: '#fff', opacity: 0.5 }}>NETWORK</span>
                              </div>

                              <div style={{ width: '80px', textAlign: 'right' }}>
                                <span style={{ fontSize: '10px', color: '#4FC3F7', fontWeight: 600 }}>
                                  {formatDate(m.joined_at || m.joinedAt)}
                                </span>
                              </div>
                            </div>
                          ))
                        )}

                        {levelMembers.length === 50 && (
                          <div style={{ padding: '8px 0', textAlign: 'center', fontSize: '10px', color: '#FF5252', fontStyle: 'italic' }}>
                            Showing latest 50 members
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
    </div>
  );
}
