import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from './store/gameStore.js';
import { useContract, useWalletLifecycle } from './hooks/useContract.js';
import LoginScreen from './components/LoginScreen.jsx';
import TopBar from './components/TopBar.jsx';
import TabBar from './components/TabBar.jsx';
import EarnScreen from './pages/EarnScreen.jsx';
import UpgradeScreen from './pages/UpgradeScreen.jsx';
import TaskScreen from './pages/TaskScreen.jsx';
import ReferralScreen from './pages/ReferralScreen.jsx';
import DashboardScreen from './pages/DashboardScreen.jsx';
import ContractsScreen from './pages/ContractsScreen.jsx';
import TeamScreen from './pages/TeamScreen.jsx';
import NodePopup from './components/NodePopup.jsx';
import DailyPopup from './components/DailyPopup.jsx';

export default function App() {
  const {
    activeTab,
    isConnected,
    rechargeEnergy,
    showNodePopup,
    showDailyPopup,
    lastClaimDate,
    setShowDailyPopup,
    setReferrerId
  } = useGameStore();
  const { connectWallet, disconnectWallet } = useContract();
  const { setupListeners, removeListeners } = useWalletLifecycle();

  // Capture Referral from URL (?ref=0x...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && /^0x[a-fA-F0-9]{40}$/.test(ref)) {
      console.log("Captured Referrer ID:", ref);
      setReferrerId(ref);
    }
  }, [setReferrerId]);

  // Entrance Check
  if (!isConnected) {
    return (
      <div className="app-container">
        <LoginScreen onConnect={connectWallet} />
        <Toaster position="top-center" />
      </div>
    );
  }

  // Energy recharge every 3s
  useEffect(() => {
    const id = setInterval(rechargeEnergy, 3000);
    return () => clearInterval(id);
  }, [rechargeEnergy]);

  // Check daily streak on load
  useEffect(() => {
    const today = new Date().toDateString();
    if (lastClaimDate !== today) {
      setTimeout(() => setShowDailyPopup(true), 1200);
    }
  }, []);

  useEffect(() => {
    setupListeners();
    
    // Initial Backend Sync only if wallet is already connected via persisted state
    const { fetchUserData, walletAddress } = useGameStore.getState();
    if (walletAddress) {
      fetchUserData().catch(() => {});
    }
    
    return () => removeListeners();
  }, []);

  return (
    <div className="app-container">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(20, 30, 51, 0.95)',
            color: '#fff',
            border: '1px solid rgba(203, 255, 1, 0.2)',
            backdropFilter: 'blur(10px)',
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 800,
            borderRadius: '14px',
            fontSize: '13px'
          }
        }}
      />

      {/* Always show TopBar for consistent wallet status visibility */}
      <TopBar onConnect={connectWallet} onDisconnect={disconnectWallet} />

      <main className="page" style={{ 
        paddingTop: '70px',
        paddingBottom: activeTab === 'earn' ? '220px' : '100px',
        display: 'flex', flexDirection: 'column',
        position: 'relative'
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ width: '100%', height: '100%' }}
          >
            {activeTab === 'earn'    && <EarnScreen />}
            {activeTab === 'mine'    && <UpgradeScreen />}
            {activeTab === 'tasks'   && <TaskScreen />}
            {activeTab === 'friends' && <ReferralScreen />}
            {activeTab === 'team'    && <TeamScreen />}
            {activeTab === 'dash'    && <DashboardScreen />}
            {activeTab === 'contracts' && <ContractsScreen />}
          </motion.div>
        </AnimatePresence>
      </main>

      <TabBar />

      {showNodePopup  && <NodePopup />}
      {showDailyPopup && <DailyPopup />}
    </div>
  );
}
