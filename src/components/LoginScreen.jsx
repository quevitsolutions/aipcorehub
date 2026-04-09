import React from 'react';
import { motion } from 'framer-motion';

export default function LoginScreen({ onConnect }) {
  return (
    <div className="login-screen" style={{
      height: '100vh',
      width: '100vw',
      background: '#05080F',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      color: '#fff'
    }}>
      {/* Dynamic Background Elements */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '40%',
        height: '40%',
        background: 'radial-gradient(circle, rgba(163, 255, 18, 0.05) 0%, transparent 70%)',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-10%',
        width: '50%',
        height: '50%',
        background: 'radial-gradient(circle, rgba(163, 255, 18, 0.03) 0%, transparent 70%)',
        zIndex: 0
      }} />

      {/* Main Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ zIndex: 1, textAlign: 'center', padding: '0 20px' }}
      >
        <div style={{ 
          fontSize: '12px', 
          fontWeight: 800, 
          color: 'var(--lime)', 
          letterSpacing: '4px',
          marginBottom: '16px'
        }}>
          AIPCORE HUB V2.0
        </div>
        
        <h1 style={{ 
          fontSize: '42px', 
          fontWeight: 900, 
          lineHeight: 1.1,
          marginBottom: '20px',
          letterSpacing: '-0.03em'
        }}>
          MINING THE <br/> 
          <span style={{ color: 'var(--lime)' }}>FUTURE OF AI</span>
        </h1>

        <p style={{ 
          fontSize: '16px', 
          opacity: 0.6, 
          maxWidth: '300px', 
          margin: '0 auto 40px',
          lineHeight: 1.5,
          fontWeight: 500
        }}>
          Connect your wallet to access your node, manage rewards, and build your team.
        </p>

        {/* Primary MetaMask Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onConnect}
          style={{
            background: 'linear-gradient(135deg, #E2761B 0%, #B65E15 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '16px',
            padding: '18px 48px',
            fontSize: '16px',
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: '0 10px 30px rgba(226, 118, 27, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            margin: '0 auto 16px',
            width: '100%',
            maxWidth: '300px'
          }}
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Logo.svg" alt="MM" height="24" />
          METAMASK
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onConnect}
          style={{
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '14px 32px',
            fontSize: '14px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            margin: '0 auto',
            width: '100%',
            maxWidth: '300px'
          }}
        >
          OTHER WALLETS
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </motion.button>

        <div style={{ marginTop: '40px' }} />
      </motion.div>

      {/* Footer Branding */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        fontSize: '11px',
        opacity: 0.3,
        fontWeight: 700,
        letterSpacing: '1px'
      }}>
        SECURED BY BNB SMART CHAIN
      </div>
    </div>
  );
}
