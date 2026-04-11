import React, { useState } from 'react';
import { CONTRACTS } from '../config/constants.js';
import { useGameStore } from '../store/gameStore.js';
import { useContract } from '../hooks/useContract.js';
import toast from 'react-hot-toast';
import { getEthersSigner } from '../utils/ethers-adapter.js';
import { ethers } from 'ethers';
import { config } from '../config/wagmi.js';
import { AIPCORE_ABI } from '../../contracts/abi.js';

// Correct income percentages as per AIPCORE contract
const INCOME_STREAMS = [
  { icon: '👥', title: 'Referral Income',  color: '#A3FF12', pct: '10%', desc: 'Earn 10% of every direct referral node purchase instantly on-chain.' },
  { icon: '🌐', title: 'Matrix Bonus',     color: '#00D4FF', pct: '70%', desc: '3×12 matrix positions fill automatically — spillover rewards to your team.' },
  { icon: '🏆', title: 'Level Rewards',   color: '#FF9500', pct: '15%', desc: 'Tiered reward pool — unlock higher payouts as your team grows.' },
  { icon: '💎', title: 'Global Pool',      color: '#FF2D55', pct: '5%',  desc: 'Qualifiers receive proportional share of the global reward pool.' },
];

const REGISTER_URL = 'https://aipcore.online/';

export default function ContractsScreen() {
  const { setActiveTab, walletAddress, hasNode, referrerId } = useGameStore();
  const [activeSection, setActiveSection] = useState('about');
  const [registering, setRegistering] = useState(false);

  // On-chain node registration via AIPCORE createNode(sponsorId)
  const handleRegisterOnChain = async () => {
    if (registering) return;
    setRegistering(true);
    try {
      const signer = await getEthersSigner(config);
      if (!signer) { toast.error('Please connect your wallet first'); setRegistering(false); return; }

      const contract = new ethers.Contract(CONTRACTS.AIPCORE, AIPCORE_ABI, signer);

      // Resolve sponsor nodeId — default to 1 (root) if no referrer or referrer has no node
      let sponsorNodeId = 1n;
      if (referrerId) {
        try {
          const refId = await contract.nodeId(referrerId);
          if (refId && Number(refId) > 0) sponsorNodeId = refId;
        } catch {}
      }

      // Get Tier 1 cost from contract
      const tierCost = await contract.getTierCost(0);

      toast.loading('Confirm transaction in your wallet...', { id: 'register' });
      const tx = await contract.createNode(sponsorNodeId, { value: tierCost });
      toast.loading(`Transaction sent: ${tx.hash.slice(0,10)}...`, { id: 'register' });
      await tx.wait();
      toast.success('Node registered! Refresh to see your stats.', { id: 'register', duration: 5000 });
    } catch (err) {
      console.error(err);
      let errMsg = err?.reason || err?.message || 'Transaction failed';
      if (errMsg.toLowerCase().includes('insufficient funds')) {
        errMsg = 'Insufficient BNB balance for transaction & gas.';
      } else if (errMsg.includes('user rejected')) {
        errMsg = 'Transaction rejected by user.';
      } else {
        errMsg = errMsg.slice(0, 80);
      }
      toast.error(errMsg, { id: 'register' });
    } finally {
      setRegistering(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`, {
      style: { background: '#1A1F26', color: '#A3FF12', border: '1px solid rgba(163, 255, 18, 0.2)' }
    });
  };

  const contractsList = [
    { label: 'AIPCORE ENGINE', address: CONTRACTS.AIPCORE, desc: 'Core node logic & rewards distribution' },
    { label: 'AIPVIEW HELPER', address: CONTRACTS.AIPVIEW, desc: 'On-chain data aggregation helper' },
    { label: 'REWARD POOL', address: CONTRACTS.REWARDPOOL, desc: 'Global staking & reward pool contract' }
  ];

  const refLink = `${REGISTER_URL}?ref=${walletAddress || ''}`;

  // Distribution bar: 10 / 70 / 15 / 5
  const distBar = [['#A3FF12', 10], ['#00D4FF', 70], ['#FF9500', 15], ['#FF2D55', 5]];

  return (
    <div style={{ paddingBottom: 20 }}>

      {/* ── Header ── */}
      <div style={{ padding: '10px 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <h2 style={{ flex: 1, fontSize: '18px', fontWeight: 900 }}>📄 DOCS & PROTOCOL</h2>
      </div>

      {/* ── Tab switcher ── */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 4, marginBottom: 20 }}>
        {[['about', '🌐 About'], ['contracts', '📑 Contracts']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveSection(id)} style={{
            flex: 1, background: activeSection === id ? 'rgba(163,255,18,0.12)' : 'none',
            border: activeSection === id ? '1px solid rgba(163,255,18,0.3)' : '1px solid transparent',
            borderRadius: 10, padding: '8px', color: activeSection === id ? 'var(--neon-lime)' : 'rgba(255,255,255,0.5)',
            fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s'
          }}>{label}</button>
        ))}
      </div>

      {/* ══ ABOUT / MARKETING SECTION ══ */}
      {activeSection === 'about' && (
        <div>
          {/* Hero */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(163,255,18,0.08) 0%, rgba(0,212,255,0.05) 100%)',
            border: '1px solid rgba(163,255,18,0.15)', borderRadius: 20, padding: '24px 20px',
            textAlign: 'center', marginBottom: 20
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
            <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8, lineHeight: 1.2 }}>
              AIPCore Protocol
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 20 }}>
              A fully decentralized node-mining network on BNB Chain. 100% of all protocol fees are distributed back to the community.
            </p>

            {/* Distribution bar: Direct 10% | Matrix 70% | Level 15% | Pool 5% */}
            <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', marginBottom: 12, height: 10 }}>
              {distBar.map(([color, pct], i) => (
                <div key={i} style={{ width: `${pct}%`, background: color }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
              {[['#A3FF12','Direct 10%'],['#00D4FF','Matrix 70%'],['#FF9500','Level 15%'],['#FF2D55','Pool 5%']].map(([c,l])=>(
                <span key={l} style={{ fontSize: 9, fontWeight: 800, color: c }}>■ {l}</span>
              ))}
            </div>
          </div>

          {/* Income streams */}
          <h3 style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginBottom: 12 }}>4 INCOME STREAMS</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {INCOME_STREAMS.map((stream, i) => (
              <div key={i} style={{
                background: 'var(--bg-card)', borderRadius: 16, padding: '14px 12px',
                border: `1px solid ${stream.color}22`, position: 'relative', overflow: 'hidden'
              }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{stream.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 900, color: stream.color, marginBottom: 2 }}>{stream.pct}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{stream.title}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{stream.desc}</div>
              </div>
            ))}
          </div>

          {/* Node tiers — 18 tiers per contract getTierCosts() returns uint256[18] */}
          <h3 style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginBottom: 12 }}>NODE TIERS (1–18)</h3>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 16, marginBottom: 20 }}>
            {[
              ['Tier 1',     '100 coins/hr',   '🟤'],
              ['Tier 2-3',   '200 coins/hr',   '🔵'],
              ['Tier 4-6',   '300 coins/hr',   '🟣'],
              ['Tier 7-9',   '500 coins/hr',   '🟡'],
              ['Tier 10-12', '800 coins/hr',   '🟠'],
              ['Tier 13-15', '1,200 coins/hr', '🔴'],
              ['Tier 16-18', '2,000+ coins/hr','💎'],
            ].map(([tier, rate, icon], i, arr) => (
              <div key={i} style={
                { display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', borderBottom: i < arr.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }
              }>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{icon} {tier}</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--neon-lime)' }}>{rate}</span>
              </div>
            ))}
          </div>

          {/* Registration — ON-CHAIN via createNode() */}
          {!hasNode && (
            <button
              onClick={handleRegisterOnChain}
              disabled={registering}
              style={{
                width: '100%', background: registering ? 'rgba(163,255,18,0.4)' : 'var(--neon-lime)',
                border: 'none', borderRadius: 16, padding: '16px', fontSize: 15, fontWeight: 900,
                color: '#000', cursor: registering ? 'wait' : 'pointer',
                boxShadow: '0 0 25px rgba(163,255,18,0.3)', marginBottom: 12, display: 'block', width: '100%'
              }}>
              {registering ? '⏳ Sending Transaction...' : '🚀 REGISTER NODE ON-CHAIN →'}
            </button>
          )}

          <a href="https://t.me/AIPCoreOfficial" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
            <button style={{
              width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16, padding: '12px', fontSize: 13, fontWeight: 800, color: '#fff', cursor: 'pointer'
            }}>
              ✈️ Join Telegram Community →
            </button>
          </a>
        </div>
      )}

      {/* ══ CONTRACTS SECTION ══ */}
      {activeSection === 'contracts' && (
        <div>
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '20px', lineHeight: '1.5' }}>
            Verifiable on-chain smart contracts powering the AIPCore ecosystem. Tap any to copy address.
          </p>

          {contractsList.map((c, i) => (
            <div key={i} className="contract-row" onClick={() => copyToClipboard(c.address, c.label)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="contract-label">{c.label}</span>
                <span style={{ fontSize: '10px', opacity: 0.5, background: 'rgba(163,255,18,0.1)', color: 'var(--neon-lime)', padding: '2px 8px', borderRadius: 20, fontWeight: 800 }}>COPY</span>
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

          <div style={{ marginTop: '24px', padding: '16px', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              All rewards are distributed algorithmically. No admin can manually trigger payouts.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
