import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Rocket, Brain, Users, Trophy, Wallet } from 'lucide-react';

// ── Animated perspective grid canvas ──────────────────────────────────────
function GridCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame;
    let offset = 0;

    const draw = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const W = canvas.width, H = canvas.height;
      const horizon = H * 0.52;
      const vp = { x: W / 2, y: horizon };

      ctx.clearRect(0, 0, W, H);

      // Vertical lines
      const numV = 22;
      for (let i = 0; i <= numV; i++) {
        const t = i / numV;
        const x = W * t;
        const alpha = 0.04 + Math.abs(t - 0.5) * 0.12;
        ctx.beginPath();
        ctx.moveTo(vp.x + (x - vp.x) * 0.01, vp.y);
        ctx.lineTo(x, H);
        ctx.strokeStyle = `rgba(0, 220, 255, ${alpha})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      // Horizontal lines
      const numH = 18;
      for (let i = 0; i <= numH; i++) {
        const tRaw = i / numH;
        const tAnim = ((tRaw + offset) % 1);
        const t = Math.pow(tAnim, 2.2);
        const y = horizon + (H - horizon) * t;
        const alpha = 0.03 + t * 0.14;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.strokeStyle = `rgba(0, 210, 255, ${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Horizon glow line
      const grad = ctx.createLinearGradient(0, horizon, W, horizon);
      grad.addColorStop(0,   'transparent');
      grad.addColorStop(0.35, 'rgba(0, 220, 255, 0.35)');
      grad.addColorStop(0.5,  'rgba(155, 81, 255, 0.55)');
      grad.addColorStop(0.65, 'rgba(0, 220, 255, 0.35)');
      grad.addColorStop(1,   'transparent');
      ctx.beginPath();
      ctx.moveTo(0, horizon);
      ctx.lineTo(W, horizon);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      offset = (offset + 0.0012) % 1;
      frame = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.85
    }} />
  );
}

export default function LoginScreen({ onConnect }) {
  const { connect } = useConnect();
  const hasInjectedProvider = typeof window !== 'undefined' && !!window.ethereum;

  return (
    <div style={{
      minHeight: '100vh', width: '100vw',
      background: '#000000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflowX: 'hidden', overflowY: 'auto',
      color: '#fff', fontFamily: 'Outfit, sans-serif',
      padding: '40px 20px'
    }}>
      <GridCanvas />

      {/* Background Orbs */}
      <div style={{
        position: 'absolute', top: '10%', left: '10%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(155,81,255,0.08) 0%, transparent 60%)',
        filter: 'blur(50px)', zIndex: 0, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', right: '5%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,210,255,0.06) 0%, transparent 60%)',
        filter: 'blur(50px)', zIndex: 0, pointerEvents: 'none'
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{
          zIndex: 10, textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          width: '100%', maxWidth: 800
        }}
      >
        {/* Logo Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{
            width: 80, height: 80, borderRadius: 24,
            background: 'linear-gradient(135deg, #7B2CBF 0%, #00D2FF 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 40,
            boxShadow: '0 0 30px rgba(155,81,255,0.4), inset 0 0 20px rgba(255,255,255,0.2)',
            marginBottom: 24, position: 'relative'
          }}
        >
          <span style={{ textShadow: '2px 2px 0px #000' }}>⚡</span>
          {/* Ring pulse */}
          <motion.div
            animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeOut' }}
            style={{
              position: 'absolute', inset: -4, borderRadius: 28,
              border: '1px solid rgba(155,81,255,0.8)',
              pointerEvents: 'none'
            }}
          />
        </motion.div>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(155,81,255,0.3)',
          borderRadius: 40, padding: '4px 12px',
          fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
          color: '#C084FC', marginBottom: 24
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#A3FF12', display: 'inline-block', boxShadow: '0 0 8px #A3FF12' }} />
          AIPCORE HUB V2.0
        </div>

        {/* Headlines */}
        <h1 style={{
          fontSize: 'clamp(36px, 7vw, 68px)',
          fontWeight: 900, lineHeight: 1.1,
          marginBottom: 16, letterSpacing: '-0.02em',
        }}>
          <span style={{ color: '#ffffff' }}>MINE </span>
          <span style={{ color: '#00D2FF' }}>TODAY.</span><br />
          <span style={{ color: '#ffffff' }}>SHAPE </span>
          <span style={{ color: '#00D2FF' }}>TOMORROW.</span>
        </h1>

        {/* Sub-headline with lines */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, width: '100%', justifyContent: 'center' }}>
           <div style={{ height: 1, flex: 1, maxWidth: 80, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2))' }} />
           <div style={{ fontSize: 'clamp(9px, 2.5vw, 13px)', fontWeight: 800, letterSpacing: 2 }}>
             <span style={{ color: '#00D2FF' }}>THE FUTURE OF AI IS HERE. </span>
             <span style={{ color: '#C084FC' }}>BE A PART OF IT.</span>
           </div>
           <div style={{ height: 1, flex: 1, maxWidth: 80, background: 'linear-gradient(270deg, transparent, rgba(255,255,255,0.2))' }} />
        </div>

        {/* Description */}
        <p style={{
          fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6,
          marginBottom: 40, fontWeight: 500, maxWidth: 460
        }}>
          Connect your wallet. Access powerful AI mining.<br/>
          Earn rewards. Build your team. Create your legacy.
        </p>

        {/* Separator Line */}
        <div style={{ width: '100%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,210,255,0.3), rgba(155,81,255,0.3), transparent)', marginBottom: 32 }} />

        {/* 4 Columns Features */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 20, width: '100%', marginBottom: 48,
          padding: '0 20px'
        }}>
           {[
             { icon: <Rocket size={20} color="#C084FC" />, title: 'DREAM BIG', desc: 'Vision is the first step to victory.' },
             { icon: <Brain size={20} color="#C084FC" />, title: 'TAKE ACTION', desc: 'Small steps today, giant leaps tomorrow.' },
             { icon: <Users size={20} color="#00D2FF" />, title: 'BUILD TOGETHER', desc: 'A strong team creates an unstoppable future.' },
             { icon: <Trophy size={20} color="#C084FC" />, title: 'NEVER QUIT', desc: 'Challenges make you stronger. Keep going.' }
           ].map((ft, i) => (
             <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left' }}>
               <div style={{ flexShrink: 0, marginTop: 2 }}>{ft.icon}</div>
               <div>
                 <div style={{ fontSize: 11, fontWeight: 800, color: '#00D2FF', marginBottom: 4, letterSpacing: 0.5 }}>{ft.title}</div>
                 <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4, fontWeight: 500 }}>{ft.desc}</div>
               </div>
             </div>
           ))}
        </div>

        {/* Connect Button */}
        <ConnectButton.Custom>
          {({ openConnectModal, mounted }) => {
            const handleConnect = () => {
              if (hasInjectedProvider) connect({ connector: injected() });
              else openConnectModal();
            };

            return (
              <div
                style={{ width: '100%', maxWidth: 360, marginBottom: 40 }}
                {...(!mounted && { 'aria-hidden': true, style: { opacity: 0, pointerEvents: 'none' } })}
              >
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 0 50px rgba(0,210,255,0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConnect}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(90deg, #00D2FF 0%, #7B2CBF 100%)',
                    color: '#fff', border: 'none', borderRadius: 16,
                    padding: '16px 24px', fontSize: 15, fontWeight: 800,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                    letterSpacing: '1px',
                    boxShadow: '0 0 30px rgba(0,210,255,0.3)',
                    fontFamily: 'Outfit, sans-serif'
                  }}
                >
                  <Wallet size={20} />
                  CONNECT WALLET
                </motion.button>
                <div style={{ marginTop: 12, fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 500, letterSpacing: 0.5 }}>
                  TokenPocket • MetaMask • Trust Wallet • WalletConnect
                </div>
              </div>
            );
          }}
        </ConnectButton.Custom>

        {/* Quote Box */}
        <div style={{
          position: 'relative', width: '100%', maxWidth: 600,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(155,81,255,0.3)',
          borderRadius: 16, padding: '24px',
          boxShadow: '0 0 30px rgba(155,81,255,0.05)'
        }}>
           <div style={{ position: 'absolute', top: 12, left: 16, fontSize: 24, color: '#C084FC', fontWeight: 900, lineHeight: 1 }}>“</div>
           <div style={{ position: 'absolute', bottom: -4, right: 16, fontSize: 24, color: '#C084FC', fontWeight: 900, lineHeight: 1 }}>”</div>
           
           <div style={{ fontSize: 'clamp(12px, 3vw, 15px)', fontWeight: 800, lineHeight: 1.5, marginBottom: 12, letterSpacing: 0.5 }}>
             THE BEST TIME TO PLANT A TREE WAS 20 YEARS AGO.<br/>
             THE SECOND BEST TIME <span style={{ color: '#00D2FF' }}>IS NOW.</span>
           </div>
           
           <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: 4 }}>
             BELIEVE • PLAN • ACT • SUCCEED
           </div>
        </div>

        {/* Footer Text */}
        <div style={{ marginTop: 32, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>
          TOGETHER, WE DON'T JUST FOLLOW THE FUTURE. <span style={{ color: '#00D2FF' }}>WE BUILD IT.</span>
        </div>
        
      </motion.div>
    </div>
  );
}
