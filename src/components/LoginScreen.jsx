import React from 'react';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';

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

        {/* Single Premium Direct Connect Button */}
        <ConnectButton.Custom>
          {({ openConnectModal, mounted }) => {
            return (
              <div
                {...(!mounted && {
                  'aria-hidden': true,
                  'style': {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  },
                })}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={openConnectModal}
                  style={{
                    background: 'var(--lime)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '20px 60px',
                    fontSize: '18px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 0 40px rgba(163, 255, 18, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    margin: '0 auto',
                    width: '100%',
                    maxWidth: '320px',
                    letterSpacing: '1px'
                  }}
                >
                  DIRECT CONNECT
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 3 21 3 21 8"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                    <polyline points="9 21 3 21 3 16"></polyline>
                    <line x1="14" y1="10" x2="3" y2="21"></line>
                  </svg>
                </motion.button>
              </div>
            );
          }}
        </ConnectButton.Custom>

        <div style={{ marginTop: '50px' }} />
      </motion.div>

      {/* Footer Branding */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        fontSize: '11px',
        opacity: 0.3,
        fontWeight: 700,
        letterSpacing: '2px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ width: '40px', height: '1px', background: 'rgba(255,255,255,0.2)' }} />
        SECURED BY BNB SMART CHAIN
        <div style={{ width: '40px', height: '1px', background: 'rgba(255,255,255,0.2)' }} />
      </div>
    </div>
  );
}
