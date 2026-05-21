import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore.js';
import toast from 'react-hot-toast';

const SEATS = [
  { name: 'CryptoQueen', avatar: '🦊', verified: true, row: 1 },
  { name: 'BlockStar', avatar: '🦁', verified: true, row: 1 },
  { name: 'AI_Explorer', avatar: '🤖', verified: true, row: 1 },
  { name: 'Web3Warrior', avatar: '🐺', verified: true, row: 1 },
  { name: 'DeFi_Guru', avatar: '🦅', verified: false, row: 2 },
  { name: 'EtherSurfer', avatar: '🐬', verified: false, row: 2 },
  { name: 'NodeMaster', avatar: '🦄', verified: true, row: 2 },
  { name: 'AlphaBuilder', avatar: '🐯', verified: false, row: 2 },
];

const SPEAKERS = [
  { name: 'Dr. Alexis Vance', role: 'Lead AI Scientist, AIP Core', bio: 'Pioneering decentralization of NLP and deep learning models on EVM environments.', avatar: '🧑‍💻' },
  { name: 'Emma Blockchain', role: 'Founder, Web3 Growth', bio: 'Advising top decentralized communities on tokenomic distribution and sustainable mining.', avatar: '👩‍💼' },
  { name: 'AIP AI Host', role: 'Autonomous Synthesized Presenter', bio: '24/7 fully synthetic presenter generating live knowledge streams.', avatar: '🤖' }
];

const AGENDA_ITEMS = [
  { time: '10:00 AM', title: 'Opening Remarks & Vision Keynote', desc: 'Setting the stage for decentralized intelligence.' },
  { time: '10:30 AM', title: 'Unveiling AIP AI Host Core Integration', desc: 'Deep dive into LLM automation via on-chain mining nodes.' },
  { time: '11:15 AM', title: 'Sustainable BNB Passive Income Architectures', desc: 'Panel debate on high-efficiency yield systems.' }
];

const EMOJI_ACTIONS = [
  { icon: '👏', count: '4.8K' },
  { icon: '😍', count: '3.2K' },
  { icon: '🚀', count: '12.5K' },
  { icon: '🔥', count: '8.4K' },
  { icon: '🎉', count: '6.1K' },
  { icon: '👍', count: '5.2K' }
];

export default function VirtualHallScreen({ onBack, event }) {
  const { walletAddress } = useGameStore();
  const [activeTab, setActiveTab] = useState('main-hall'); // 'lobby' | 'main-hall' | 'sponsors' | 'network' | 'expo' | 'wallet'
  const [voiceActive, setVoiceActive] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [messages, setMessages] = useState([
    { user: 'Emma Blockchain', msg: 'Amazing event! 🚀', time: '10:01 AM' },
    { user: 'DeFi Hunter', msg: 'The future is here! 💜', time: '10:02 AM' },
    { user: 'MoonBuilder', msg: 'Love the AI avatar host!', time: '10:03 AM' },
    { user: 'Web3Max', msg: 'Great insights so far 🔥', time: '10:03 AM' },
    { user: 'StakingKing', msg: 'This is next level! 🔥', time: '10:04 AM' },
    { user: 'NFT Queen', msg: 'Super excited for what is coming next! 📣', time: '10:04 AM' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [reactions, setReactions] = useState({ '👏': 4800, '😍': 3200, '🚀': 12500, '🔥': 8400, '🎉': 6100, '👍': 5200 });
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [activeOverlay, setActiveOverlay] = useState(null); // 'agenda' | 'speakers' | 'schedule' | 'support' | 'avatar'
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [waveScale, setWaveScale] = useState(1);
  const chatEndRef = useRef(null);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speaking waveform animation
  useEffect(() => {
    const iv = setInterval(() => {
      setWaveScale(0.8 + Math.random() * 0.4);
    }, 120);
    return () => clearInterval(iv);
  }, []);

  // Slide cycle
  const slides = [
    {
      title: 'The Future of AI-Powered Communities',
      sub: 'Connecting People, Intelligence and Opportunities in Web3',
      bullets: ['AI Avatar Interaction', 'Decentralized Identity', 'Smart Communities', 'Global Networking']
    },
    {
      title: 'Node Activation & Rewards Ecosystem',
      sub: 'Fueling decentralized computational workflows with $AIP',
      bullets: ['Computational Mining Pools', 'Passive BNB Distribution', 'Tier-Based Boost Multipliers', 'Instant Rewards Claim']
    }
  ];

  useEffect(() => {
    const iv = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % slides.length);
    }, 15000);
    return () => clearInterval(iv);
  }, []);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const shortAddr = walletAddress ? `${walletAddress.slice(0, 6)}...` : '0xYou';
    setMessages(prev => [...prev, { user: `🐼 ${shortAddr}`, msg: chatInput, time: '10:05 AM' }]);
    setChatInput('');

    // Trigger synthetic AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { user: '🤖 AIP AI Host', msg: 'Thanks for participating! Feel free to raise your hand to ask questions live.', time: '10:05 AM', isAI: true }]);
    }, 2000);
  };

  const handleEmojiClick = (emoji) => {
    setReactions(prev => ({ ...prev, [emoji]: prev[emoji] + 1 }));
    const id = Date.now() + Math.random();
    setFloatingReactions(prev => [...prev, { id, emoji, x: 20 + Math.random() * 60 }]);
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(f => f.id !== id));
    }, 3000);
  };

  const fmtShortAddress = addr => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '0x7A3F...98de';

  return (
    <div style={{
      minHeight: '100vh', background: '#05070F', color: '#fff',
      fontFamily: 'Outfit, sans-serif', overflowX: 'hidden', paddingBottom: 80
    }}>
      <style>{`
        @keyframes radarSweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spinRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* ── TOP HEADER / DECENTRALAND NAVBAR (Inspired by Image 1) ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(5, 7, 15, 0.95)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            background: 'linear-gradient(135deg, #4FC3F7, #A3FF12)',
            width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#000', fontSize: 18
          }}>⬡</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 0.5, color: '#fff' }}>AIP CORE</div>
            <div style={{ fontSize: 8, color: '#4FC3F7', fontWeight: 700, letterSpacing: 1.5 }}>AI · WEB3 · COMMUNITY</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
          {[
            { id: 'lobby', label: '🏠 Lobby' },
            { id: 'main-hall', label: '🏟️ Main Hall' },
            { id: 'sponsors', label: '🏢 Sponsor Halls' },
            { id: 'network', label: '🤝 Network Lounge' },
            { id: 'expo', label: '🖼️ Expo Zone' }
          ].map(t => (
            <button key={t.id} onClick={() => {
              setActiveTab(t.id);
              if (t.id === 'lobby') onBack();
            }}
              style={{
                background: activeTab === t.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: 'none', color: activeTab === t.id ? '#A3FF12' : 'rgba(255,255,255,0.6)',
                padding: '6px 14px', borderRadius: 16, fontSize: 11, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* User Status / Wallet */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 850, color: '#fff' }}>John Web3</div>
            <div style={{ fontSize: 9, color: '#A3FF12', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#A3FF12' }} /> Online
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '6px 12px', fontSize: 10, fontWeight: 800, color: '#4FC3F7'
          }}>
            🔑 {fmtShortAddress(walletAddress)}
          </div>
        </div>
      </div>

      {/* ── MAIN THREE-COLUMN META CONVENTION GRID ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '260px 1fr 300px', gap: 20, padding: 20,
        maxWidth: 1600, margin: '0 auto'
      }}>
        
        {/* ── LEFT PANEL: EVENT SUMMARY & AGENDA ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Summit Info */}
          <div style={{
            background: 'linear-gradient(135deg, #0D111A 0%, #080B13 100%)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 18
          }}>
            <span style={{ background: 'rgba(255,68,68,0.15)', border: '1px solid #FF4444', color: '#FF4444', fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 8, letterSpacing: 0.5 }}>● LIVE NOW</span>
            <h2 style={{ fontSize: 15, fontWeight: 900, color: '#fff', marginTop: 10, lineHeight: 1.25 }}>AIP CORE GLOBAL SUMMIT</h2>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, lineHeight: 1.4 }}>The Future of AI, Web3 and Decentralized Communities</p>
            
            <div style={{ display: 'flex', gap: 14, marginTop: 14, fontSize: 11, fontWeight: 700, color: '#fff' }}>
              <span>👥 1,248 attending</span>
              <span>📅 May 31, 2025</span>
            </div>

            <button onClick={() => setActiveOverlay('agenda')}
              style={{
                width: '100%', marginTop: 16, padding: '11px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #4FC3F7, #A3FF12)', color: '#000', fontSize: 12, fontWeight: 900, cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(163,255,18,0.25)'
              }}>
              📅 Event Agenda
            </button>
          </div>

          {/* Sub menu controls */}
          <div style={{
            background: 'rgba(22,27,34,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 8, display: 'flex', flexDirection: 'column', gap: 4
          }}>
            {[
              { id: 'speakers', label: '👥 Guest Speakers' },
              { id: 'schedule', label: '📅 Full Schedule' },
              { id: 'support', label: '🛠️ Event Support' }
            ].map(m => (
              <button key={m.id} onClick={() => setActiveOverlay(m.id)}
                style={{
                  width: '100%', padding: '11px 16px', borderRadius: 10, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.7)',
                  textAlign: 'left', fontSize: 12, fontWeight: 800, cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}>
                <span>{m.label}</span>
                <span>›</span>
              </button>
            ))}
          </div>

          {/* Blueprint Hall Map (Inspired by Left-Lower Blueprint) */}
          <div style={{
            background: 'rgba(22,27,34,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 16
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5, marginBottom: 10 }}>HALL RADAR MAP</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 76, height: 76, borderRadius: '50%', border: '2px solid rgba(163,255,18,0.2)', position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, rgba(163,255,18,0.06) 0%, transparent 80%)'
              }}>
                <div style={{ position: 'absolute', width: '70%', height: '70%', borderRadius: '50%', border: '1px dashed rgba(163,255,18,0.3)' }} />
                <div style={{ position: 'absolute', width: '40%', height: '40%', borderRadius: '50%', border: '1px solid rgba(163,255,18,0.4)' }} />
                {/* Radar line sweep */}
                <div style={{
                  position: 'absolute', width: '50%', height: 2, background: 'linear-gradient(90deg, #A3FF12, transparent)',
                  transformOrigin: 'left center', top: '50%', left: '50%', animation: 'radarSweep 4s linear infinite'
                }} />
                <span style={{ fontSize: 16, zIndex: 2 }}>⬡</span>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>AIP Core Arena</div>
                <div style={{ fontSize: 9, color: '#A3FF12', marginTop: 2 }}>Concentric Zone A</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── MIDDLE PANEL: STAGE, SEATING GRID ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>
          
          {/* Floating Emoji animations */}
          <AnimatePresence>
            {floatingReactions.map(f => (
              <motion.div key={f.id}
                initial={{ opacity: 1, y: 220, x: `${f.x}%`, scale: 1 }}
                animate={{ opacity: 0, y: -60, scale: 1.8 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.5, ease: 'easeOut' }}
                style={{ position: 'absolute', pointerEvents: 'none', zIndex: 10, fontSize: 32 }}>
                {f.emoji}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Immersive high-tech stage screen */}
          <div style={{
            background: 'linear-gradient(180deg, #090E17 0%, #05080E 100%)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 24, position: 'relative', overflow: 'hidden'
          }}>
            {/* Hologram scanline screen grid overlay */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.05, pointerEvents: 'none',
              backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 4px)'
            }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #4FC3F7, #A3FF12, transparent)' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, position: 'relative', zIndex: 2 }}>
              {/* Slide text presentation */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: 10, color: '#A3FF12', fontWeight: 800, letterSpacing: 1.5 }}>AIP CORE GLOBAL PRESENTS</span>
                <h1 style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginTop: 6, lineHeight: 1.25 }}>
                  {slides[currentSlideIndex].title}
                </h1>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, lineHeight: 1.4 }}>
                  {slides[currentSlideIndex].sub}
                </p>

                {/* Bullet points on slide */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                  {slides[currentSlideIndex].bullets.map((b, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>
                      <span style={{ color: '#A3FF12' }}>✔</span> {b}
                    </div>
                  ))}
                </div>
              </div>

              {/* Speaker Stage Display with wave visualizer */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: 20 }}>
                {/* AI Speaker avatar */}
                <div style={{ position: 'relative', width: 84, height: 84, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,195,247,0.15) 0%, transparent 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 3 }} style={{ fontSize: 52 }}>
                    🤖
                  </motion.div>
                  {/* Floating concentric ring */}
                  <div style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: '1px solid rgba(163,255,18,0.2)', animation: 'spinRing 10s linear infinite' }} />
                </div>
                <div style={{
                  background: 'rgba(163,255,18,0.12)', border: '1px solid #A3FF12', borderRadius: 12, padding: '4px 12px', fontSize: 9, fontWeight: 900, color: '#A3FF12', marginTop: 10
                }}>
                  AIP CORE AI HOST
                </div>

                {/* Speaks Waveform */}
                <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 16, marginTop: 12 }}>
                  {Array.from({ length: 12 }).map((_, idx) => (
                    <div key={idx} style={{
                      width: 2.5,
                      height: `${(idx % 2 === 0 ? 6 : 14) * waveScale}px`,
                      background: 'linear-gradient(180deg, #A3FF12, #4FC3F7)',
                      borderRadius: 1,
                      transition: 'height 0.1s ease-in-out'
                    }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Seating Grid Row with Verified Attendees (Exactly like Decentraland screen) */}
          <div style={{
            background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 24, padding: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5 }}>AUDIENCE SEATING</span>
              <span style={{ fontSize: 10, color: '#A3FF12', fontWeight: 800 }}>FRONT ROW VIP ZONE</span>
            </div>

            {/* Row 1 Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
              {SEATS.slice(0, 4).map((s, idx) => (
                <div key={idx} style={{
                  background: 'rgba(22,27,34,0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '10px 12px', textAlign: 'center', position: 'relative'
                }}>
                  <div style={{ fontSize: 24 }}>{s.avatar}</div>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#fff', marginTop: 4, display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center' }}>
                    {s.name} {s.verified && <span style={{ color: '#4FC3F7', fontSize: 8 }}>✔</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Row 2 Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {SEATS.slice(4, 8).map((s, idx) => (
                <div key={idx} style={{
                  background: 'rgba(22,27,34,0.4)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 14, padding: '10px 12px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: 22 }}>{s.avatar}</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.6)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center' }}>
                    {s.name} {s.verified && <span style={{ color: '#4FC3F7', fontSize: 8 }}>✔</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: CHAT FEED, REACTIONS & NAVIGATION ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Chat Feed Panel */}
          <div style={{
            background: 'linear-gradient(135deg, #0D111A 0%, #080B13 100%)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 16, display: 'flex', flexDirection: 'column', height: 260
          }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>💬 Live Chat</span>
              <span style={{ fontSize: 8, color: '#A3FF12' }}>● LIVE CHATROOM</span>
            </div>

            {/* Message rows */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
              {messages.map((m, idx) => (
                <div key={idx} style={{ fontSize: 10, lineHeight: 1.35 }}>
                  <strong style={{ color: m.isAI ? '#A3FF12' : '#4FC3F7' }}>{m.user}: </strong>
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>{m.msg}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Send */}
            <form onSubmit={handleSendChat} style={{ display: 'flex', gap: 4, marginTop: 8 }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message..."
                style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 10, outline: 'none' }} />
              <button type="submit" style={{ background: '#4FC3F7', border: 'none', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>↑</button>
            </form>
          </div>

          {/* Audience Reaction picker dashboard */}
          <div style={{
            background: 'rgba(22,27,34,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 14
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5, marginBottom: 8 }}>AUDIENCE REACTIONS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {EMOJI_ACTIONS.map(em => (
                <button key={em.icon} onClick={() => handleEmojiClick(em.icon)}
                  style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 4px', cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}>
                  <span style={{ fontSize: 16 }}>{em.icon}</span>
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{reactions[em.icon]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Navigation grid */}
          <div style={{
            background: 'rgba(22,27,34,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 14
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5, marginBottom: 8 }}>QUICK NAVIGATION</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {[
                { id: 'lobby', label: '🏠 Lobby' },
                { id: 'sponsors', label: '🏢 Sponsors' },
                { id: 'network', label: '🤝 Network' },
                { id: 'expo', label: '🖼️ Expo' }
              ].map(q => (
                <button key={q.id} onClick={() => {
                  setActiveTab(q.id);
                  if (q.id === 'lobby') onBack();
                }}
                  style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px', cursor: 'pointer',
                    fontSize: 9, fontWeight: 900, color: '#fff', transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#A3FF12'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM CONTROL DASHBOARD (Inspired by bottom overlay bar) ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(5, 7, 15, 0.95)', backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
      }}>
        {/* Voice Chat */}
        <button onClick={() => {
          setVoiceActive(!voiceActive);
          toast.success(voiceActive ? '🔇 Microphone Muted' : '🎙️ Voice Chat Activated!');
        }}
          style={{
            background: voiceActive ? 'rgba(163,255,18,0.1)' : 'rgba(255,255,255,0.05)',
            border: voiceActive ? '1px solid #A3FF12' : '1px solid rgba(255,255,255,0.1)',
            color: voiceActive ? '#A3FF12' : 'rgba(255,255,255,0.6)',
            padding: '10px 20px', borderRadius: 12, fontSize: 11, fontWeight: 900, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
          <span>🎙️</span> {voiceActive ? 'Voice Connected' : 'Voice Chat'}
        </button>

        {/* Raise Hand */}
        <button onClick={() => {
          setHandRaised(!handRaised);
          toast.success(handRaised ? 'Lowered Hand' : '✋ Hand Raised! Requested host for stage stage.');
        }}
          style={{
            background: handRaised ? 'rgba(79,195,247,0.1)' : 'rgba(255,255,255,0.05)',
            border: handRaised ? '1px solid #4FC3F7' : '1px solid rgba(255,255,255,0.1)',
            color: handRaised ? '#4FC3F7' : 'rgba(255,255,255,0.6)',
            padding: '10px 20px', borderRadius: 12, fontSize: 11, fontWeight: 900, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
          <span>✋</span> {handRaised ? 'Hand Raised' : 'Raise Hand'}
        </button>

        {/* Action picker trigger */}
        <button onClick={() => toast.success('Reactions picker triggered')}
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)',
            padding: '10px 20px', borderRadius: 12, fontSize: 11, fontWeight: 900, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
          <span>😍</span> Reactions
        </button>

        {/* Settings */}
        <button onClick={() => toast.success('Settings and avatar config details loaded')}
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)',
            padding: '10px 20px', borderRadius: 12, fontSize: 11, fontWeight: 900, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
          <span>⚙️</span> Settings
        </button>

        {/* Leave Event */}
        <button onClick={onBack}
          style={{
            background: 'rgba(255,82,82,0.15)', border: '1px solid #FF5252', color: '#FF5252',
            padding: '10px 20px', borderRadius: 12, fontSize: 11, fontWeight: 900, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto'
          }}>
          <span>🚪</span> Leave Event
        </button>
      </div>

      {/* ── AGENDA / SPEAKERS / DETAILS OVERLAYS ── */}
      <AnimatePresence>
        {activeOverlay && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={() => setActiveOverlay(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#0D1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 24, width: '100%', maxWidth: 400
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#A3FF12' }}>
                  {activeOverlay === 'agenda' && '📅 Event Agenda'}
                  {activeOverlay === 'speakers' && '👥 Guest Speakers'}
                  {activeOverlay === 'schedule' && '📅 Full Schedule'}
                  {activeOverlay === 'support' && '🛠️ Event Support'}
                </span>
                <button onClick={() => setActiveOverlay(null)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer' }}>×</button>
              </div>

              {/* Overlay Contents */}
              <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeOverlay === 'agenda' && AGENDA_ITEMS.map((item, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 12 }}>
                    <div style={{ fontSize: 10, color: '#A3FF12', fontWeight: 900 }}>{item.time}</div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#fff', marginTop: 2 }}>{item.title}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, lineHeight: 1.4 }}>{item.desc}</div>
                  </div>
                ))}

                {activeOverlay === 'speakers' && SPEAKERS.map((s, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 32 }}>{s.avatar}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 900, color: '#fff' }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: '#4FC3F7', fontWeight: 700 }}>{s.role}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 4, lineHeight: 1.4 }}>{s.bio}</div>
                    </div>
                  </div>
                ))}

                {activeOverlay === 'schedule' && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                    <p><strong>AIP Core Global Summit</strong> is scheduled to stream globally. Main stages cycle active presentational slides with synchronized multi-region audio feeds.</p>
                    <p style={{ marginTop: 8 }}>Join lounge spaces after the closing remarks for decentralized networking and physical location matching.</p>
                  </div>
                )}

                {activeOverlay === 'support' && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                    <p>Having trouble connecting to Voice Chat or claiming partner swag items?</p>
                    <p style={{ marginTop: 8 }}>Reach out in global chat or ping the <strong>🤖 AI Host</strong> directly to reset node integrations.</p>
                  </div>
                )}
              </div>

              <button onClick={() => setActiveOverlay(null)}
                style={{
                  width: '100%', marginTop: 20, padding: '10px', borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, cursor: 'pointer'
                }}>
                Dismiss Details
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
