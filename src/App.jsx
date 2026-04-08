import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useGameStore } from './store/gameStore.js';
import { useContract, useWalletLifecycle } from './hooks/useContract.js';
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
    rechargeEnergy,
    showNodePopup,
    showDailyPopup,
    lastClaimDate,
    setShowDailyPopup
  } = useGameStore();
  const { connectWallet, disconnectWallet } = useContract();
  const { setupListeners, removeListeners } = useWalletLifecycle();

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

  // Auto-init Telegram WebApp
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      window.Telegram.WebApp.setHeaderColor('#05080F');
      window.Telegram.WebApp.setBackgroundColor('#05080F');
    }

    // Parse referral from URL
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || params.get('start');
    if (ref) {
      const parsed = ref.replace('ref_', '');
      useGameStore.getState().setReferrerId(parsed);
    }
  }, []);

  // Wallet event listeners & Auto-connect
  useEffect(() => {
    setupListeners();
    
    // 1. Initial Backend Sync
    const { fetchUserData } = useGameStore.getState();
    fetchUserData().catch(() => {});

    // 2. Attempt auto-connect once on mount
    const persisted = localStorage.getItem('aipcore-game-state');
    if (persisted) {
      try {
        const state = JSON.parse(persisted);
        if (state.state.isConnected && state.state.walletAddress) {
          // Sync existing wallet to store
          useGameStore.getState().setWallet(state.state.walletAddress);
          // Gently check node data
          connectWallet().catch(() => {});
        }
      } catch (e) {
        console.warn("Auto-connect failed:", e);
      }
    }
    
    return () => removeListeners();
    // eslint-disable-next-line
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

      <div className="page" style={{ 
        paddingBottom: activeTab === 'earn' ? '220px' : '100px',
        display: 'flex', flexDirection: 'column' 
      }}>
        {activeTab === 'earn'    && <EarnScreen />}
        {activeTab === 'mine'    && <UpgradeScreen />}
        {activeTab === 'tasks'   && <TaskScreen />}
        {activeTab === 'friends' && <ReferralScreen />}
        {activeTab === 'team'    && <TeamScreen />}
        {activeTab === 'dash'    && <DashboardScreen />}
        {activeTab === 'contracts' && <ContractsScreen />}
      </div>

      <TabBar />

      {showNodePopup  && <NodePopup />}
      {showDailyPopup && <DailyPopup />}
    </div>
  );
}
