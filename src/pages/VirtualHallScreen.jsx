import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore.js';
import toast from 'react-hot-toast';

/* ── Seat layout ─────────────────────────────────────── */
const ROWS = [
  { count: 5, scale: 0.62, y: 0,   label: 'VIP' },
  { count: 7, scale: 0.74, y: 52,  label: 'A' },
  { count: 9, scale: 0.86, y: 108, label: 'B' },
  { count: 11,scale: 1.0,  y: 168, label: 'C' },
];

const AVATARS = ['🦁','🐯','🦊','🐺','🐻','🐸','🦅','🐬','🦋','🐙','🦄','🐲'];

// Pre-fill seats with random "other" attendees
const buildSeats = (mySlot) => {
  let id = 1;
  return ROWS.map((row, ri) =>
    Array.from({ length: row.count }, (_, si) => {
      const isMe = ri === mySlot.row && si === mySlot.seat;
      const occupied = isMe || Math.random() > 0.28;
      return { id: id++, row: ri, seat: si, isMe, occupied,
        avatar: isMe ? '🐼' : occupied ? AVATARS[Math.floor(Math.random() * AVATARS.length)] : null,
        name: isMe ? 'You' : occupied ? `0x${Math.random().toString(16).slice(2,6)}...` : null };
    })
  );
};

/* ── AI presentation slides ──────────────────────────── */
const SLIDES = [
  { title: 'AI + Passive BNB Income Masterclass', sub: 'Session 1 of 4 · AIP Core MetaVerse', bg: 'linear-gradient(135deg,#0a1628,#1a2f50)' },
  { title: '5 Proven Passive Income Strategies', sub: 'Referrals · Staking · Mining · NFTs · DAO Rewards', bg: 'linear-gradient(135deg,#0a1a2a,#0d2d1a)' },
  { title: 'BNB Reward Pool — Live Stats', sub: '12.4 BNB Distributed This Month · Growing 40% MoM', bg: 'linear-gradient(135deg,#1a0a28,#2d0a1a)' },
  { title: 'Your Referral Dashboard', sub: 'Share your link → Earn multi-level BNB commissions', bg: 'linear-gradient(135deg,#1a1a0a,#2d2a0a)' },
];

const REACTIONS = ['🔥','👏','💎','🚀','💰','⚡','🎯','❤️'];

const LIVE_CHAT = [
  { user:'🦁 0x8f2...', msg:'This strategy changed everything for me 🔥', t:0 },
  { user:'🐯 0xa91...', msg:'Already earning 0.4 BNB/month from referrals!', t:3 },
  { user:'🤖 AI Host',  msg:'Welcome everyone! Slide 2 coming up…', t:6, isAI:true },
  { user:'🦊 0x3c4...', msg:'When does the NFT drop happen?', t:9 },
  { user:'🐻 0x1d2...', msg:'LFG!! Tier 3 node incoming 🚀', t:12 },
];

export default function VirtualHallScreen({ onBack, event }) {
  const { hasNode, nodeTier, walletAddress } = useGameStore();
  const mySlot = { row: 3, seat: 5 };
  const [seats]         = useState(() => buildSeats(mySlot));
  const [slide, setSlide]         = useState(0);
  const [chatOpen, setChatOpen]   = useState(false);
  const [chatMsg, setChatMsg]     = useState('');
  const [messages, setMessages]   = useState(LIVE_CHAT);
  const [floating, setFloating]   = useState([]);   // floating emoji reactions
  const [reactionBar, setReactionBar] = useState(false);
  const [spotlight, setSpotlight] = useState(null); // hovered seat info
  const [attendees]               = useState(seats.flat().filter(s=>s.occupied).length);
  const [elapsed, setElapsed]     = useState(0);
  const [earned, setEarned]       = useState(0);
  const chatEndRef = useRef(null);
  const timerRef   = useRef(null);

  /* Auto-advance slides */
  useEffect(() => {
    const iv = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 12000);
    return () => clearInterval(iv);
  }, []);

  /* Session timer + drip rewards */
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(e => e + 1);
      if (elapsed % 30 === 29) setEarned(e => e + 50); // +50 AIP every 30s
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [elapsed]);

  /* Auto-scroll chat */
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  /* Drip chat messages */
  useEffect(() => {
    const timeouts = LIVE_CHAT.map(m =>
      setTimeout(() => {
        setMessages(prev => prev.some(p=>p.msg===m.msg) ? prev : [...prev, m]);
      }, m.t * 1000 + 14000) // replay after 14s
    );
    return () => timeouts.forEach(clearTimeout);
  }, []);

  const fmtTime = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const sendReaction = (emoji) => {
    const id = Date.now() + Math.random();
    setFloating(prev => [...prev, { id, emoji, x: 30 + Math.random() * 60 }]);
    setTimeout(() => setFloating(prev => prev.filter(f => f.id !== id)), 2800);
    setReactionBar(false);
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (!chatMsg.trim()) return;
    const addr = walletAddress ? `${walletAddress.slice(0,6)}...` : '0xYou...';
    setMessages(prev => [...prev, { user:`🐼 ${addr}`, msg: chatMsg, t: Date.now() }]);
    setChatMsg('');
  };

  const claimAndLeave = () => {
    toast.success(`🏅 Session complete! +${earned} $AIP earned. Attendance NFT minted!`, { duration: 5000, icon:'🎉' });
    setTimeout(onBack, 600);
  };

  return (
    <div style={{ position:'relative', minHeight:'100vh', background:'#040810', overflow:'hidden', fontFamily:'Outfit,sans-serif' }}>

      {/* ── TOP HUD ─────────────────────────────────── */}
      <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'rgba(4,8,16,0.85)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(163,255,18,0.12)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={claimAndLeave} style={{ background:'rgba(255,255,255,0.07)', border:'none', color:'#fff', fontSize:18, width:34, height:34, borderRadius:9, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
          <div>
            <div style={{ fontSize:13, fontWeight:900, color:'#fff', lineHeight:1 }}>
              {event?.title || 'AI + Passive BNB Income Masterclass'}
            </div>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', marginTop:2 }}>🌐 AIP MetaVerse Auditorium</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {/* Live badge */}
          <div style={{ background:'rgba(255,68,68,0.2)', border:'1px solid rgba(255,68,68,0.5)', borderRadius:8, padding:'4px 10px', display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#FF4444', animation:'liveBlink 1.2s infinite' }} />
            <span style={{ fontSize:10, fontWeight:900, color:'#FF4444' }}>LIVE</span>
          </div>
          {/* Timer */}
          <div style={{ background:'rgba(163,255,18,0.1)', border:'1px solid rgba(163,255,18,0.25)', borderRadius:8, padding:'4px 10px', fontSize:11, fontWeight:900, color:'#A3FF12', fontVariantNumeric:'tabular-nums' }}>
            ⏱ {fmtTime(elapsed)}
          </div>
          {/* Reward drip */}
          <div style={{ background:'rgba(255,215,0,0.1)', border:'1px solid rgba(255,215,0,0.25)', borderRadius:8, padding:'4px 10px', fontSize:11, fontWeight:900, color:'#FFD700' }}>
            +{earned} $AIP
          </div>
        </div>
      </div>

      {/* ── STAGE AREA ──────────────────────────────── */}
      <div style={{ paddingTop:54, paddingBottom: chatOpen ? 340 : 180 }}>

        {/* Ambient glow behind stage */}
        <div style={{ position:'absolute', top:54, left:'50%', transform:'translateX(-50%)', width:420, height:220, background:'radial-gradient(ellipse, rgba(163,255,18,0.08) 0%, transparent 70%)', pointerEvents:'none' }} />

        {/* Stage frame with 3D perspective */}
        <div style={{ perspective:900, perspectiveOrigin:'50% 0%', padding:'20px 16px 0' }}>
          <div style={{ transform:'rotateX(4deg) scaleX(0.96)', transformOrigin:'50% 0%', position:'relative', borderRadius:'18px 18px 0 0', overflow:'hidden' }}>

            {/* Presentation screen */}
            <AnimatePresence mode="wait">
              <motion.div key={slide}
                initial={{ opacity:0, scale:1.04 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.97 }}
                transition={{ duration:0.6 }}
                style={{ background: SLIDES[slide].bg, borderRadius:'18px 18px 0 0', padding:'28px 24px 20px', minHeight:170, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', textAlign:'center', border:'1px solid rgba(163,255,18,0.18)', borderBottom:'none', position:'relative', overflow:'hidden' }}>

                {/* Screen scanline effect */}
                <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 4px)', pointerEvents:'none' }} />
                {/* Corner brackets */}
                {[['0','0','top','left'],['0','0','top','right'],['auto','0','bottom','left'],['auto','0','bottom','right']].map(([t,b,tv,lv],i)=>(
                  <div key={i} style={{ position:'absolute', [tv==='top'?'top':'bottom']:10, [lv==='left'?'left':'right']:12, width:18, height:18, borderTop: tv==='top'?'2px solid rgba(163,255,18,0.5)':'none', borderBottom: tv==='bottom'?'2px solid rgba(163,255,18,0.5)':'none', borderLeft: lv==='left'?'2px solid rgba(163,255,18,0.5)':'none', borderRight: lv==='right'?'2px solid rgba(163,255,18,0.5)':'none' }} />
                ))}

                {/* AI Host avatar */}
                <motion.div animate={{ scale:[1,1.06,1] }} transition={{ duration:3, repeat:Infinity }}
                  style={{ fontSize:38, marginBottom:10, filter:'drop-shadow(0 0 16px rgba(128,203,196,0.6))' }}>🤖</motion.div>

                <div style={{ fontSize:17, fontWeight:900, color:'#fff', lineHeight:1.25, marginBottom:8, position:'relative' }}>
                  {SLIDES[slide].title}
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>{SLIDES[slide].sub}</div>

                {/* Slide progress dots */}
                <div style={{ display:'flex', gap:6, marginTop:14 }}>
                  {SLIDES.map((_,i) => (
                    <div key={i} onClick={()=>setSlide(i)} style={{ width: i===slide?20:6, height:6, borderRadius:3, background: i===slide?'#A3FF12':'rgba(255,255,255,0.2)', cursor:'pointer', transition:'all 0.3s' }} />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Stage floor / apron */}
            <div style={{ height:20, background:'linear-gradient(180deg,rgba(163,255,18,0.05),transparent)', borderLeft:'1px solid rgba(163,255,18,0.1)', borderRight:'1px solid rgba(163,255,18,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:'60%', height:1, background:'rgba(163,255,18,0.15)' }} />
            </div>
          </div>
        </div>

        {/* ── SEATING ROWS ─────────────────────────── */}
        <div style={{ padding:'0 10px', position:'relative' }}>
          {/* Floating reactions */}
          <AnimatePresence>
            {floating.map(f => (
              <motion.div key={f.id}
                initial={{ opacity:1, y:0, x:`${f.x}%`, scale:1 }}
                animate={{ opacity:0, y:-160, scale:1.6 }}
                exit={{ opacity:0 }}
                transition={{ duration:2.5, ease:'easeOut' }}
                style={{ position:'absolute', top:20, fontSize:28, pointerEvents:'none', zIndex:30 }}>
                {f.emoji}
              </motion.div>
            ))}
          </AnimatePresence>

          {ROWS.map((row, ri) => (
            <div key={ri} style={{ display:'flex', justifyContent:'center', alignItems:'flex-end', gap: ri===0?8:ri===1?7:ri===2?6:5, marginBottom:4, transform:`scale(${row.scale})`, transformOrigin:'50% 0%', marginTop: ri===0?-10:0 }}>
              {seats[ri].map(seat => (
                <motion.div key={seat.id} whileHover={{ scale:1.18, zIndex:20 }}
                  onMouseEnter={() => seat.occupied && setSpotlight(seat)}
                  onMouseLeave={() => setSpotlight(null)}
                  style={{ position:'relative', cursor: seat.occupied?'pointer':'default' }}>
                  {/* Seat glow for me */}
                  {seat.isMe && <div style={{ position:'absolute', inset:-4, borderRadius:'50%', background:'rgba(163,255,18,0.3)', filter:'blur(6px)', zIndex:-1 }} />}
                  {/* Avatar bubble */}
                  <div style={{
                    width: ri<2?32:ri===2?36:40, height: ri<2?32:ri===2?36:40,
                    borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize: ri<2?14:ri===2?16:18,
                    background: seat.isMe ? 'rgba(163,255,18,0.2)' : seat.occupied ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                    border: seat.isMe ? '2px solid #A3FF12' : seat.occupied ? '1px solid rgba(255,255,255,0.12)' : '1px dashed rgba(255,255,255,0.06)',
                    transition:'all 0.15s',
                    boxShadow: seat.isMe ? '0 0 12px rgba(163,255,18,0.4)' : 'none',
                  }}>
                    {seat.occupied ? seat.avatar : ''}
                  </div>
                  {/* Seat number under */}
                  {!seat.occupied && <div style={{ textAlign:'center', fontSize:7, color:'rgba(255,255,255,0.1)', marginTop:2 }}>{row.label}{seat.seat+1}</div>}
                </motion.div>
              ))}
            </div>
          ))}

          {/* Spotlight tooltip */}
          <AnimatePresence>
            {spotlight && (
              <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', background:'rgba(22,27,34,0.97)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'6px 12px', fontSize:11, color:'#fff', fontWeight:700, whiteSpace:'nowrap', zIndex:40, pointerEvents:'none' }}>
                {spotlight.isMe ? '🐼 You' : spotlight.avatar} {spotlight.name}
                {spotlight.isMe && <span style={{ color:'#A3FF12', marginLeft:6 }}>← That's you!</span>}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Attendee count bar */}
          <div style={{ textAlign:'center', marginTop:6, fontSize:9, color:'rgba(255,255,255,0.3)', fontWeight:700 }}>
            {attendees} / 500 SEATS · ROW VIP → C
          </div>
        </div>
      </div>

      {/* ── BOTTOM CONTROL BAR ──────────────────────── */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:50, background:'rgba(4,8,16,0.95)', backdropFilter:'blur(16px)', borderTop:'1px solid rgba(163,255,18,0.1)', padding:'10px 14px' }}>

        {/* Chat panel (slides up) */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div initial={{ height:0, opacity:0 }} animate={{ height:210, opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.25 }}
              style={{ overflow:'hidden', marginBottom:10 }}>
              <div style={{ height:160, overflowY:'auto', display:'flex', flexDirection:'column', gap:8, paddingBottom:6 }}>
                {messages.map((m,i)=>(
                  <div key={i} style={{ fontSize:11 }}>
                    <span style={{ fontWeight:900, color: m.isAI?'#80CBC4':'#CE93D8' }}>{m.user}: </span>
                    <span style={{ color:'rgba(255,255,255,0.75)' }}>{m.msg}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={sendChat} style={{ display:'flex', gap:8 }}>
                <input value={chatMsg} onChange={e=>setChatMsg(e.target.value)} placeholder="Say something to the hall..."
                  style={{ flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'8px 12px', color:'#fff', fontSize:12, outline:'none', fontFamily:'Outfit,sans-serif' }} />
                <button type="submit" style={{ background:'#CE93D8', border:'none', borderRadius:10, padding:'8px 14px', fontSize:14, fontWeight:900, color:'#000', cursor:'pointer' }}>↑</button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reaction picker */}
        <AnimatePresence>
          {reactionBar && (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:10 }}
              style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:10 }}>
              {REACTIONS.map(r=>(
                <button key={r} onClick={()=>sendReaction(r)}
                  style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'7px 10px', fontSize:20, cursor:'pointer', transition:'transform 0.1s' }}
                  onMouseDown={e=>e.currentTarget.style.transform='scale(0.85)'}
                  onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}>
                  {r}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Control buttons row */}
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {/* React */}
          <button onClick={()=>{ setReactionBar(v=>!v); setChatOpen(false); }}
            style={{ flex:1, padding:'11px 6px', borderRadius:12, border: reactionBar?'1px solid rgba(255,215,0,0.4)':'1px solid rgba(255,255,255,0.08)', background: reactionBar?'rgba(255,215,0,0.1)':'rgba(255,255,255,0.05)', color:'#FFD700', fontSize:11, fontWeight:800, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            <span style={{ fontSize:20 }}>🎭</span>React
          </button>
          {/* Chat */}
          <button onClick={()=>{ setChatOpen(v=>!v); setReactionBar(false); }}
            style={{ flex:1, padding:'11px 6px', borderRadius:12, border: chatOpen?'1px solid rgba(206,147,216,0.4)':'1px solid rgba(255,255,255,0.08)', background: chatOpen?'rgba(206,147,216,0.1)':'rgba(255,255,255,0.05)', color:'#CE93D8', fontSize:11, fontWeight:800, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            <span style={{ fontSize:20 }}>💬</span>Chat
          </button>
          {/* Raise hand */}
          <button onClick={()=>{ sendReaction('✋'); toast('✋ Hand raised! AI Host will call on you.', { duration:3000 }); }}
            style={{ flex:1, padding:'11px 6px', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.05)', color:'#4FC3F7', fontSize:11, fontWeight:800, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            <span style={{ fontSize:20 }}>✋</span>Hand
          </button>
          {/* NFT claim / leave */}
          <button onClick={claimAndLeave}
            style={{ flex:1.4, padding:'11px 6px', borderRadius:12, border:'1px solid rgba(163,255,18,0.3)', background:'rgba(163,255,18,0.1)', color:'#A3FF12', fontSize:11, fontWeight:900, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            <span style={{ fontSize:20 }}>🏅</span>Claim & Leave
          </button>
        </div>
      </div>
    </div>
  );
}
