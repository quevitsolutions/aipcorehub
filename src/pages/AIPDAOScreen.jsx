import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore.js';
import toast from 'react-hot-toast';

const PROPOSALS = [
  {
    id: 1, status: 'active', title: 'AIP-007: Launch Cross-Chain Bridge to Polygon',
    description: 'Allocate 5 BNB from treasury to fund a Polygon bridge, enabling multi-chain NFT transfers and expanding the community reach by 40%.',
    author: '0x8f2...3a1', votes: { for: 2840, against: 340, abstain: 120 },
    deadline: '2 days left', category: 'Treasury', impact: 'High',
    discussion: 42,
  },
  {
    id: 2, status: 'active', title: 'AIP-008: Add Mobile App Development Milestone',
    description: 'Propose development of a dedicated AIP Core mobile app (iOS & Android) with Web3 wallet integration and metaverse access.',
    author: '0xa91...7c2', votes: { for: 1920, against: 580, abstain: 200 },
    deadline: '5 days left', category: 'Product', impact: 'Medium',
    discussion: 28,
  },
  {
    id: 3, status: 'active', title: 'AIP-009: Increase Referral Commission to 15%',
    description: 'Adjust Level 1 referral commission from 10% to 15% to incentivize community growth and attract high-tier sponsors.',
    author: '0xc33...9f4', votes: { for: 3200, against: 1100, abstain: 80 },
    deadline: '1 day left', category: 'Tokenomics', impact: 'High',
    discussion: 67,
  },
  {
    id: 4, status: 'passed', title: 'AIP-006: Monthly AI Webinar Series',
    description: 'Approve 8 BNB budget for hosting 4 monthly AI-powered webinars on passive income strategies.',
    author: '0xf7b...2e8', votes: { for: 4100, against: 220, abstain: 90 },
    deadline: 'Passed Apr 2026', category: 'Events', impact: 'High',
    discussion: 91,
  },
  {
    id: 5, status: 'rejected', title: 'AIP-005: Reduce Node Activation Fee',
    description: 'Proposal to reduce Tier 1 node activation fee from $50 to $25 to improve accessibility.',
    author: '0x1d2...6a5', votes: { for: 800, against: 2400, abstain: 300 },
    deadline: 'Rejected Mar 2026', category: 'Tokenomics', impact: 'High',
    discussion: 54,
  },
];

const TREASURY = {
  total: '28.4 BNB',
  allocated: '12.1 BNB',
  available: '16.3 BNB',
  multisig: '3/5 signatures',
};

const statusColor = { active: '#A3FF12', passed: '#4FC3F7', rejected: '#FF5252' };
const statusLabel = { active: '🗳️ ACTIVE', passed: '✅ PASSED', rejected: '❌ REJECTED' };

export default function AIPDAOScreen({ onBack }) {
  const { hasNode, nodeId } = useGameStore();
  const [userVotes, setUserVotes] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [filterStatus, setFilterStatus] = useState('active');
  const [tab, setTab] = useState('proposals');

  const handleVote = (proposalId, choice) => {
    if (!hasNode) return toast.error('🔒 Activate your node to participate in DAO governance', { duration: 4000 });
    if (userVotes[proposalId]) return toast.error('You already voted on this proposal', { duration: 2500 });
    setUserVotes(prev => ({ ...prev, [proposalId]: choice }));
    toast.success(`🗳️ Vote "${choice}" recorded on-chain via Snapshot!`, { duration: 4000 });
  };

  const filtered = PROPOSALS.filter(p => filterStatus === 'all' || p.status === filterStatus);

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', fontSize: 18, width: 36, height: 36, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 900 }}>🏛️ AIP DAO Hall</h1>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>Community Governance · Treasury · Voting</div>
        </div>
      </div>

      {/* DAO Power Banner */}
      <div style={{
        borderRadius: 18, padding: 16, marginBottom: 18,
        background: 'linear-gradient(135deg, rgba(27,67,50,0.8) 0%, rgba(13,17,23,0.95) 100%)',
        border: '1px solid rgba(163,255,18,0.25)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#A3FF12' }}>Your Voting Power</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Based on node tier & $AIP holdings</div>
          </div>
          {hasNode ? (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#A3FF12' }}>1,000</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>VP (Node #{nodeId})</div>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.3)', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 800, color: '#FF8A80' }}>🔒 No Node</div>
          )}
        </div>
        {hasNode && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
              <span>Governance Rank</span><span style={{ color: '#A3FF12' }}>Top 15%</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 4 }}>
              <div style={{ height: '100%', width: '85%', background: 'linear-gradient(90deg, #A3FF12, #4FC3F7)', borderRadius: 4 }} />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['proposals', 'treasury', 'my-votes'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800,
              background: tab === t ? '#A3FF12' : 'rgba(255,255,255,0.05)', color: tab === t ? '#000' : 'rgba(255,255,255,0.5)' }}>
            {t === 'proposals' ? '📋 Proposals' : t === 'treasury' ? '💰 Treasury' : '🗳️ My Votes'}
          </button>
        ))}
      </div>

      {/* PROPOSALS TAB */}
      {tab === 'proposals' && (
        <>
          {/* Status filter */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {['active', 'passed', 'rejected', 'all'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                style={{ padding: '5px 12px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 800,
                  background: filterStatus === s ? (s === 'active' ? '#A3FF12' : s === 'passed' ? '#4FC3F7' : s === 'rejected' ? '#FF5252' : '#fff') : 'rgba(255,255,255,0.05)',
                  color: filterStatus === s ? '#000' : 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>
                {s}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((proposal, i) => {
              const totalVotes = proposal.votes.for + proposal.votes.against + proposal.votes.abstain;
              const forPct = totalVotes > 0 ? Math.round((proposal.votes.for / totalVotes) * 100) : 0;
              const againstPct = totalVotes > 0 ? Math.round((proposal.votes.against / totalVotes) * 100) : 0;
              const myVote = userVotes[proposal.id];
              const isExpanded = expanded === proposal.id;

              return (
                <motion.div key={proposal.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  style={{
                    background: 'rgba(22,27,34,0.95)', borderRadius: 16, overflow: 'hidden',
                    border: myVote ? '1px solid rgba(163,255,18,0.3)' : '1px solid rgba(255,255,255,0.05)',
                  }}>
                  <div style={{ padding: 14, cursor: 'pointer' }} onClick={() => setExpanded(isExpanded ? null : proposal.id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ flex: 1, paddingRight: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ background: `${statusColor[proposal.status]}20`, color: statusColor[proposal.status], fontSize: 8, fontWeight: 900, padding: '2px 7px', borderRadius: 8 }}>
                            {statusLabel[proposal.status]}
                          </span>
                          <span style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 8 }}>{proposal.category}</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', lineHeight: 1.3, marginBottom: 3 }}>{proposal.title}</div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>by {proposal.author} · {proposal.deadline} · 💬 {proposal.discussion}</div>
                      </div>
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: '0.2s' }}>›</span>
                    </div>

                    {/* Vote bar */}
                    <div style={{ marginTop: 10 }}>
                      <div style={{ display: 'flex', gap: 3, height: 6, borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${forPct}%`, background: '#A3FF12', transition: 'width 0.5s' }} />
                        <div style={{ width: `${againstPct}%`, background: '#FF5252', transition: 'width 0.5s' }} />
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginTop: 4, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                        <span style={{ color: '#A3FF12' }}>FOR {forPct}%</span>
                        <span>{totalVotes.toLocaleString()} votes</span>
                        <span style={{ color: '#FF5252' }}>AGAINST {againstPct}%</span>
                      </div>
                    </div>

                    {myVote && (
                      <div style={{ marginTop: 8, fontSize: 10, color: '#A3FF12', fontWeight: 800 }}>✓ You voted: {myVote.toUpperCase()}</div>
                    )}
                  </div>

                  {/* Expanded */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ padding: '14px 16px' }}>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 14 }}>{proposal.description}</div>
                          {proposal.status === 'active' && !myVote && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                              {[['FOR', '#A3FF12'], ['AGAINST', '#FF5252'], ['ABSTAIN', '#4FC3F7']].map(([choice, color]) => (
                                <button key={choice} onClick={() => handleVote(proposal.id, choice.toLowerCase())}
                                  style={{ padding: '10px 4px', borderRadius: 10, border: `1px solid ${color}40`, background: `${color}10`, color, fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>
                                  {choice}
                                </button>
                              ))}
                            </div>
                          )}
                          {proposal.status === 'active' && myVote && (
                            <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(163,255,18,0.08)', borderRadius: 12, fontSize: 13, fontWeight: 800, color: '#A3FF12' }}>
                              ✅ Vote submitted on-chain via Snapshot
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* TREASURY TAB */}
      {tab === 'treasury' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'rgba(22,27,34,0.9)', border: '1px solid rgba(163,255,18,0.2)', borderRadius: 18, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#A3FF12', marginBottom: 14 }}>💰 DAO Treasury</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[['Total Holdings', TREASURY.total, '#FFD700'], ['Available', TREASURY.available, '#A3FF12'], ['Allocated', TREASURY.allocated, '#4FC3F7'], ['Multisig', TREASURY.multisig, '#CE93D8']].map(([label, val, color]) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color }}>{val}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'rgba(22,27,34,0.9)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Recent Allocations</div>
            {[['Webinar Series Budget', '8 BNB', 'Events'], ['Developer Grants', '2.5 BNB', 'Dev'], ['Marketing Campaign', '1.6 BNB', 'Marketing']].map(([name, amount, tag]) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{name}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{tag}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#FF5252' }}>-{amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MY VOTES TAB */}
      {tab === 'my-votes' && (
        <div>
          {Object.keys(userVotes).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
              🗳️ You haven't voted yet. Go to Proposals to participate!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(userVotes).map(([id, vote]) => {
                const p = PROPOSALS.find(pr => pr.id === parseInt(id));
                return p ? (
                  <div key={id} style={{ background: 'rgba(22,27,34,0.9)', border: '1px solid rgba(163,255,18,0.2)', borderRadius: 14, padding: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{p.title}</div>
                    <div style={{ fontSize: 10, color: '#A3FF12', fontWeight: 900 }}>✓ Voted: {vote.toUpperCase()}</div>
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
