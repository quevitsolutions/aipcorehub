import React from 'react';
import { CONTRACTS } from '../config/constants.js';
import { useGameStore } from '../store/gameStore.js';
import toast from 'react-hot-toast';

export default function ContractsScreen() {
  const { setActiveTab } = useGameStore();

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`, {
      style: {
        background: '#1A1F26',
        color: '#A3FF12',
        border: '1px solid rgba(163, 255, 18, 0.2)'
      }
    });
  };

  const contractsList = [
    { label: 'AIPCORE ENGINE', address: CONTRACTS.AIPCORE, desc: 'Core logic & rewards distribution' },
    { label: 'AIPVIEW HELPER', address: CONTRACTS.AIPVIEW, desc: 'On-chain data aggregation' },
    { label: 'REWARD POOL', address: CONTRACTS.REWARDPOOL, desc: 'Global staking & reward pool' }
  ];

  return (
    <div className="page">
      <div style={{ padding: '10px 0 20px', display: 'flex', alignItems: 'center' }}>
        <button 
          onClick={() => setActiveTab('dash')}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}
        >←</button>
        <h2 style={{ flex: 1, textAlign: 'center', fontSize: '20px', fontWeight: 900 }}>CONTRACTS</h2>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-dim)', textAlign: 'center', marginBottom: '24px', lineHeight: '1.5' }}>
        Verifiable on-chain smart contracts powering the NodeFlow ecosystem.
      </p>

      {contractsList.map((c, i) => (
        <div key={i} className="contract-row" onClick={() => copyToClipboard(c.address, c.label)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="contract-label">{c.label}</span>
            <span style={{ fontSize: '10px', opacity: 0.5 }}>CC</span>
          </div>
          <span className="contract-addr">{c.address}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>{c.desc}</span>
          
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '16px' }}>
            <a 
              href={`https://bscscan.com/address/${c.address}`} 
              target="_blank" 
              rel="noreferrer"
              style={{ fontSize: '11px', color: 'var(--neon-lime)', textDecoration: 'none', fontWeight: 700 }}
              onClick={(e) => e.stopPropagation()}
            >VIEW ON BSCSCAN ↗</a>
          </div>
        </div>
      ))}

      <div style={{ marginTop: '40px', padding: '20px', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
          All rewards are distributed algorithmically. No admin can manually trigger payouts.
        </span>
      </div>
    </div>
  );
}
