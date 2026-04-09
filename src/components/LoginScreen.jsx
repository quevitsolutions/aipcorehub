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

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onConnect}
          style={{
            background: 'var(--lime)',
            color: '#000',
            border: 'none',
            borderRadius: '16px',
            padding: '18px 48px',
            fontSize: '16px',
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: '0 0 30px rgba(163, 255, 18, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '0 auto'
          }}
        >
          CONNECT WALLET
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </motion.button>

        {/* Official SDK Bridge (Invisible fallback / Rescue) */}
        <div style={{ marginTop: '24px', opacity: 0.8, display: 'flex', justifyContent: 'center' }}>
          <appkit-button />
        </div>

        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '24px', opacity: 0.4 }}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Logo.svg" alt="MetaMask" height="20" />
          <img src="https://walletconnect.com/favicon.ico" alt="WalletConnect" height="20" />
          <img src="https://trustwallet.com/assets/images/favicon.png" alt="Trust Wallet" height="20" />
        </div>
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
