import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';

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

      // Vertical lines (converging to vanishing point)
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

      // Horizontal lines (receding into horizon)
      const numH = 18;
      for (let i = 0; i <= numH; i++) {
        const tRaw = i / numH;
        // exponential spacing for perspective feel, animated by scroll
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
  return (
    <div style={{
      height: '100vh', width: '100vw',
      background: '#000000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      color: '#fff', fontFamily: 'Outfit, sans-serif'
    }}>
      {/* ── Perspective Grid ── */}
      <GridCanvas />

      {/* ── Background Orbs ── */}
      <div style={{
        position: 'absolute', top: '10%', left: '10%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(155,81,255,0.12) 0%, transparent 65%)',
        filter: 'blur(40px)', zIndex: 0, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', right: '5%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,210,255,0.1) 0%, transparent 65%)',
        filter: 'blur(40px)', zIndex: 0, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', top: '40%', left: '50%',
        transform: 'translateX(-50%)',
        width: 600, height: 200, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(155,81,255,0.08) 0%, transparent 70%)',
        filter: 'blur(30px)', zIndex: 0, pointerEvents: 'none'
      }} />

      {/* ── Main Content Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        style={{
          zIndex: 10, textAlign: 'center', padding: '0 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          maxWidth: 480, width: '100%'
        }}
      >
        {/* Logo mark */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, type: 'spring' }}
          style={{ marginBottom: 28, position: 'relative' }}
        >
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'linear-gradient(135deg, #9B51FF 0%, #00D2FF 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 34, fontWeight: 900, color: '#fff',
            boxShadow: '0 0 40px rgba(155,81,255,0.5), 0 0 80px rgba(0,210,255,0.2)',
            margin: '0 auto',
          }}>
            ⚡
          </div>
          {/* Ring pulse */}
          <motion.div
            animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
            style={{
              position: 'absolute', inset: -6, borderRadius: 26,
              border: '2px solid rgba(155,81,255,0.6)',
              pointerEvents: 'none'
            }}
          />
        </motion.div>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(155,81,255,0.12)',
          border: '1px solid rgba(155,81,255,0.3)',
          borderRadius: 40, padding: '5px 16px',
          fontSize: 10, fontWeight: 800, letterSpacing: 2,
          color: '#C084FC', marginBottom: 20
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#A3FF12', display: 'inline-block', boxShadow: '0 0 6px #A3FF12' }} />
          AIPCORE HUB V2.0
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(36px, 9vw, 56px)',
          fontWeight: 900, lineHeight: 1.05,
          marginBottom: 18, letterSpacing: '-0.03em',
        }}>
          <span style={{ color: '#ffffff' }}>MINING THE</span><br />
          <span style={{
            background: 'linear-gradient(90deg, #00D2FF 0%, #9B51FF 50%, #00D2FF 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>FUTURE OF AI</span>
        </h1>

        {/* Subtext */}
        <p style={{
          fontSize: 14, opacity: 0.55, maxWidth: 300, lineHeight: 1.7,
          marginBottom: 40, fontWeight: 500
        }}>
          Connect your wallet to access your node, manage rewards, and build your team.
        </p>

        {/* Stats row */}
        <div style={{
          display: 'flex', gap: 0,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, overflow: 'hidden',
          marginBottom: 36, width: '100%', maxWidth: 360
        }}>
          {[
            { label: 'Total Nodes', value: '36,999+', color: '#00D2FF' },
            { label: 'Max Tier', value: '18', color: '#9B51FF' },
            { label: 'Chain', value: 'BNB', color: '#F0B90B' },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, padding: '14px 8px', textAlign: 'center',
              borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none'
            }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: s.color, marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Connect Button */}
        <ConnectButton.Custom>
          {({ openConnectModal, mounted }) => (
            <div
              style={{ width: '100%', maxWidth: 360 }}
              {...(!mounted && { 'aria-hidden': true, style: { opacity: 0, pointerEvents: 'none' } })}
            >
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 0 60px rgba(155,81,255,0.5), 0 0 30px rgba(0,210,255,0.3)' }}
                whileTap={{ scale: 0.97 }}
                onClick={openConnectModal}
                style={{
                  width: '100%',
                  background: 'linear-gradient(90deg, #00D2FF 0%, #9B51FF 55%, #00D2FF 100%)',
                  backgroundSize: '200% auto',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 16,
                  padding: '18px 32px',
                  fontSize: 16,
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  letterSpacing: '1.5px',
                  boxShadow: '0 0 35px rgba(155,81,255,0.4), 0 0 15px rgba(0,210,255,0.2)',
                  fontFamily: 'Outfit, sans-serif',
                  position: 'relative', overflow: 'hidden',
                  transition: 'box-shadow 0.3s ease'
                }}
              >
                {/* Shimmer overlay */}
                <motion.div
                  animate={{ x: ['-150%', '150%'] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                  style={{
                    position: 'absolute', top: 0, bottom: 0, width: '50%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                    transform: 'skewX(-20deg)', pointerEvents: 'none'
                  }}
                />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="6" width="22" height="13" rx="2" ry="2" />
                  <path d="M1 10h22" />
                </svg>
                CONNECT WALLET
              </motion.button>

              {/* Supported wallets note */}
              <div style={{ marginTop: 14, fontSize: 11, color: '#FFFFFF', fontWeight: 600, letterSpacing: 0.5 }}>
                MetaMask · WalletConnect · Trust Wallet · Coinbase
              </div>
            </div>
          )}
        </ConnectButton.Custom>

        {/* How it works steps */}
        <div style={{ marginTop: 48, display: 'flex', gap: 6, width: '100%', maxWidth: 360 }}>
          {[
            { n: '01', label: 'Connect', desc: 'Link your BNB wallet' },
            { n: '02', label: 'Register', desc: 'Activate your node' },
            { n: '03', label: 'Earn', desc: 'Mine & collect rewards' },
          ].map((step, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', padding: '12px 4px' }}>
              <div style={{
                fontSize: 22, fontWeight: 900, lineHeight: 1,
                WebkitTextStroke: '1px rgba(155,81,255,0.7)',
                color: 'transparent', marginBottom: 4
              }}>{step.n}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', marginBottom: 3 }}>{step.label}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Footer ── */}
      <div style={{
        position: 'absolute', bottom: 24, zIndex: 10,
        fontSize: 10, opacity: 0.3, fontWeight: 700, letterSpacing: 2,
        display: 'flex', alignItems: 'center', gap: 10
      }}>
        <div style={{ width: 30, height: 1, background: 'rgba(255,255,255,0.2)' }} />
        SECURED BY BNB SMART CHAIN
        <div style={{ width: 30, height: 1, background: 'rgba(255,255,255,0.2)' }} />
      </div>
    </div>
  );
}
