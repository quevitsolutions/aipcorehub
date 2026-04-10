import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { useContract } from '../hooks/useContract.js';
import { formatNumber, formatBNB, shortAddr } from '../utils/format.js';
import { CONTRACTS } from '../config/constants.js';

export default function DashboardScreen() {
  const {
    walletAddress, hasNode, nodeId, nodeActive, nodeTier,
    totalEarned, pendingReward, teamSize, directRefs,
    poolClaimable, poolQual, localReward, streak, isConnected,
    conversionHistory
  } = useGameStore();
  const { loadNodeData, connectWallet, claimPool, fetchTeamCounts } = useContract();

  const [levelCounts, setLevelCounts] = useState([]);

  useEffect(() => {
    if (walletAddress) {
      loadNodeData(walletAddress);
    }
  }, [walletAddress, loadNodeData]);

  useEffect(() => {
    if (isConnected && nodeId) {
      fetchTeamCounts(nodeId).then(setLevelCounts);
    }
  }, [isConnected, nodeId, fetchTeamCounts]);

  const calcDirects = levelCounts.length > 0 ? levelCounts[0] : (directRefs || 0);
  const calcTotal = levelCounts.length > 0 ? levelCounts.reduce((a, b) => a + b, 0) : (teamSize || 0);

  return (
    <div className="page page-dashboard">
      {/* Hero Header */}
      <div style={{ padding: '20px 0 32px', textAlign: 'center' }}>
        <div style={{ position: 'relative', width: '90px', height: '90px', margin: '0 auto 16px' }}>
          <div style={{ 
            width: '100%', height: '100%', 
            background: 'var(--bg-card)', 
            borderRadius: '24px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '36px',
            border: `2px solid ${hasNode && nodeActive ? 'var(--neon-lime)' : '#FF3B30'}`,
            boxShadow: hasNode && nodeActive ? '0 0 20px rgba(203, 255, 1, 0.2)' : 'none'
          }}>
            {hasNode ? '⬡' : '👤'}
          </div>
          {hasNode && nodeActive && (
            <div style={{ 
              position: 'absolute', bottom: -5, right: -5,
              width: '24px', height: '24px', borderRadius: '50%',
              background: 'var(--neon-lime)', border: '4px solid var(--bg-dark)',
              animation: 'pulse 2s infinite'
            }} />
          )}
        </div>
        <h2 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.02em' }}>
          {hasNode ? `NODE #${nodeId}` : 'GUEST OPERATOR'}
        </h2>
        <div style={{ 
          display: 'inline-flex', padding: '4px 12px', borderRadius: '20px', 
          background: 'rgba(255,255,255,0.05)', marginTop: 8, gap: 8, alignItems: 'center'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)' }}>
            {isConnected ? shortAddr(walletAddress) : 'NOT CONNECTED'}
          </span>
          {isConnected && <span style={{ color: 'var(--neon-lime)', fontSize: '10px' }}>●</span>}
        </div>
      </div>

      {/* Main Revenue Grid */}
      <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-dim)', marginBottom: 12 }}>REVENUE COMMAND</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div className="partner-card" style={{ flexDirection: 'column', alignItems: 'flex-start', margin: 0, padding: 16 }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-dim)' }}>TAPPING</span>
          <span style={{ fontSize: '18px', fontWeight: 900 }}>{formatNumber(localReward)} 🪙</span>
        </div>
        <div className="partner-card" style={{ flexDirection: 'column', alignItems: 'flex-start', margin: 0, padding: 16 }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-dim)' }}>PENDING</span>
          <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--neon-lime)' }}>{formatBNB(pendingReward)}</span>
        </div>
        <div className="partner-card" style={{ flexDirection: 'column', alignItems: 'flex-start', margin: 0, padding: 16 }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-dim)' }}>POOL SHARE</span>
          <span style={{ fontSize: '18px', fontWeight: 900 }}>{formatBNB(poolClaimable)}</span>
        </div>
        <div className="partner-card" style={{ flexDirection: 'column', alignItems: 'flex-start', margin: 0, padding: 16 }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-dim)' }}>TOTAL EARNED</span>
          <span style={{ fontSize: '18px', fontWeight: 900 }}>{formatBNB(totalEarned)}</span>
        </div>
      </div>

      {/* Reward Pool Command Center */}
      <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-dim)', marginBottom: 12 }}>COMMAND: REWARD POOL</h3>
      <div className="partner-card" style={{ flexDirection: 'column', padding: 20, marginBottom: 24, background: 'rgba(203, 255, 1, 0.02)', border: '1px solid rgba(203, 255, 1, 0.1)' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-dim)' }}>ACTIVE POOL</span>
            <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--neon-lime)' }}>{poolQual.poolName.toUpperCase()}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-dim)' }}>SELF CONTRIBUTION</span>
            <div style={{ fontSize: '16px', fontWeight: 900 }}>${formatNumber(poolQual.totalDeposited)}</div>
          </div>
        </div>

        {/* Qualification Bars */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { label: 'DIRECT FRIENDS', current: calcDirects, missing: poolQual.missingDirects },
            { label: 'SELF LEVEL', current: nodeTier, missing: poolQual.missingTier },
            { label: 'TOTAL TEAM', current: calcTotal, missing: poolQual.missingTeam },
          ].map(req => {
            const total = req.current + req.missing;
            const progress = total === 0 ? 0 : Math.min(100, (req.current / total) * 100);
            return (
              <div key={req.label} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-dim)' }}>{req.label}</span>
                  <span style={{ fontSize: '10px', fontWeight: 900, color: progress >= 100 ? 'var(--neon-lime)' : '#fff' }}>
                    {req.current} / {total}
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: progress >= 100 ? 'var(--neon-lime)' : '#555', transition: 'width 1s ease' }} />
                </div>
              </div>
            );
          })}
        </div>

        {poolClaimable > 0 && (
          <button 
            className="giant-btn" 
            style={{ marginTop: 24, background: 'var(--neon-lime)', color: '#000', height: 44, fontSize: 13 }}
            onClick={() => claimPool(nodeId)}
          >
            CLAIM POOL REWARDS ({formatBNB(poolClaimable)})
          </button>
        )}
      </div>

      {/* Network Stats Card */}
      <div className="partner-card" style={{ flexDirection: 'column', padding: 20, marginBottom: 32 }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: '14px', fontWeight: 800 }}>NETWORK GROWTH</span>
          <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--neon-lime)' }}>LEVEL {nodeTier}</span>
        </div>
        <div style={{ width: '100%', display: 'flex', gap: 32 }}>
          <div className="flex-column">
            <span style={{ fontSize: '24px', fontWeight: 900 }}>{calcDirects}</span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-dim)' }}>DIRECT FRIENDS</span>
          </div>
          <div className="flex-column">
            <span style={{ fontSize: '24px', fontWeight: 900 }}>{calcTotal}</span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-dim)' }}>TOTAL NETWORK</span>
          </div>
        </div>
        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginTop: 20, overflow: 'hidden' }}>
          <div style={{ width: '45%', height: '100%', background: 'var(--neon-lime)', boxShadow: '0 0 10px var(--neon-lime)' }} />
        </div>
      </div>

      {/* Token Conversion History */}
      <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-dim)', marginBottom: 12, marginTop: 32 }}>HISTORY: TOKEN CONVERSION</h3>
      <div className="partner-card" style={{ flexDirection: 'column', padding: 20, marginBottom: 32 }}>
        {conversionHistory.length > 0 ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {conversionHistory.map((item, idx) => (
              <div key={idx} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                paddingBottom: 12, borderBottom: idx !== conversionHistory.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' 
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800 }}>{item.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--neon-lime)' }}>{formatNumber(item.mined_amount)} 🪙</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 800 }}>CONVERTED</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-dim)', width: '100%' }}>
            <div style={{ fontSize: '24px', marginBottom: 8 }}>📜</div>
            <div style={{ fontSize: '11px', fontWeight: 800 }}>NO CONVERSIONS RECORDED YET</div>
          </div>
        )}
      </div>

      {/* Wallet Actions */}
      {!isConnected ? (
        <button className="giant-btn" style={{ position: 'relative', bottom: 0, marginBottom: 32 }} onClick={connectWallet}>
          CONNECT BSC WALLET
        </button>
      ) : (
        <div className="partner-card" style={{ padding: 16, justifyContent: 'space-between', background: 'rgba(255,59,48,0.05)', border: '1px solid rgba(255,59,48,0.1)' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#FF3B30' }}>CONNECTED WALLET</span>
          <span style={{ fontSize: '12px', fontWeight: 700 }}>{shortAddr(walletAddress)}</span>
        </div>
      )}

      {/* Contract Verification Section */}
      <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-dim)', margin: '32px 0 12px', textAlign: 'center' }}>
        SMART CONTRACT VERIFICATION
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, paddingBottom: 60 }}>
        {[
          { name: 'CORE', addr: CONTRACTS.AIPCORE },
          { name: 'VIEW', addr: CONTRACTS.AIPVIEW },
          { name: 'POOL', addr: CONTRACTS.REWARDPOOL },
        ].map(c => (
          <a 
            key={c.name}
            href={`https://bscscan.com/address/${c.addr}`}
            target="_blank" rel="noreferrer"
            style={{ 
              background: 'var(--bg-card)', padding: '16px 8px', 
              borderRadius: '16px', textAlign: 'center', textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 900, color: '#fff', marginBottom: 4 }}>{c.name}</div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--neon-lime)' }}>{shortAddr(c.addr)}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
