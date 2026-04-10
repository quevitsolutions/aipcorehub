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
import AdminScreen from './pages/AdminScreen.jsx';
import MarketingScreen from './pages/MarketingScreen.jsx';
import NodePopup from './components/NodePopup.jsx';
import DailyPopup from './components/DailyPopup.jsx';

// Sidebar nav definition (desktop)
const NAV_ITEMS = [
  { id: 'earn',      icon: '⛏️',  label: 'Mine' },
  { id: 'mine',      icon: '🚀',  label: 'Boost' },
  { id: 'friends',   icon: '👥',  label: 'Friends' },
  { id: 'team',      icon: '🌐',  label: 'Team' },
  { id: 'dash',      icon: '📊',  label: 'Stats' },
  { id: 'contracts', icon: '📄',  label: 'Docs' },
  { id: 'tasks',     icon: '✅',  label: 'Tasks' },
];

function DesktopSidebar({ activeTab, setActiveTab, nodeId, nodeTier }) {
  return (
    <aside className="desktop-sidebar">
      <div className="sidebar-logo">
        <div style={{ width: 32, height: 32, background: 'var(--neon-lime)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#000' }}>A</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 900 }}>AIPCORE <span style={{ fontSize: 9, color: 'var(--neon-lime)', opacity: 0.7 }}>PRO</span></div>
          {nodeId && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>NODE #{nodeId} · T{nodeTier}</div>}
        </div>
      </div>

      {NAV_ITEMS.map(item => (
        <button key={item.id} className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
          onClick={() => setActiveTab(item.id)}>
          <span className="sidebar-icon">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </aside>
  );
}

const TOAST_STYLE = {
  background: 'rgba(20,30,51,0.95)', color: '#fff',
  border: '1px solid rgba(203,255,1,0.2)', backdropFilter: 'blur(10px)',
  fontFamily: 'Outfit, sans-serif', fontWeight: 800, borderRadius: '14px', fontSize: '13px'
};

export default function App() {
  const {
    activeTab, setActiveTab,
    isConnected, hasNode,
    rechargeEnergy,
    showNodePopup, showDailyPopup, lastClaimDate,
    setShowDailyPopup, setReferrerId,
    nodeId, nodeTier
  } = useGameStore();

  const { connectWallet, disconnectWallet } = useContract();
  const { setupListeners, removeListeners } = useWalletLifecycle();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && /^0x[a-fA-F0-9]{40}$/.test(ref)) setReferrerId(ref);
  }, [setReferrerId]);

  useEffect(() => {
    if (!isConnected) return;
    const today = new Date().toDateString();
    if (lastClaimDate !== today) setTimeout(() => setShowDailyPopup(true), 1200);
  }, [isConnected, lastClaimDate, setShowDailyPopup]);

  useEffect(() => {
    if (!isConnected) return;
    setupListeners();
    const { fetchUserData, walletAddress } = useGameStore.getState();
    if (walletAddress) fetchUserData().catch(() => {});
    return () => removeListeners();
  }, [isConnected, setupListeners, removeListeners]);

  if (!isConnected) {
    return (
      <div className="app-container">
        <LoginScreen onConnect={connectWallet} />
        <Toaster position="top-center" toastOptions={{ style: TOAST_STYLE }} />
      </div>
    );
  }

  if (isConnected && !hasNode) {
    return (
      <div className="app-container">
        <Toaster position="top-center" toastOptions={{ style: TOAST_STYLE }} />
        <MarketingScreen onConnect={connectWallet} onDisconnect={disconnectWallet} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Toaster position="top-center" toastOptions={{ style: TOAST_STYLE }} />

      {/* Desktop sidebar (hidden on mobile/tablet via CSS) */}
      <DesktopSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        nodeId={nodeId}
        nodeTier={nodeTier}
      />

      {/* TopBar — fixed on mobile/tablet, grid on desktop */}
      <TopBar onConnect={connectWallet} onDisconnect={disconnectWallet} />

      {/* Main content area */}
      <main className="page" style={{
        paddingBottom: '84px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ width: '100%', height: '100%' }}
          >
            {activeTab === 'earn'      && <EarnScreen />}
            {activeTab === 'mine'      && <UpgradeScreen />}
            {activeTab === 'tasks'     && <TaskScreen />}
            {activeTab === 'friends'   && <ReferralScreen />}
            {activeTab === 'team'      && <TeamScreen />}
            {activeTab === 'dash'      && <DashboardScreen />}
            {activeTab === 'contracts' && <ContractsScreen />}
            {activeTab === 'admin'     && <AdminScreen />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom tabs — hidden on desktop via CSS */}
      <TabBar />

      {showNodePopup  && <NodePopup />}
      {showDailyPopup && <DailyPopup />}
    </div>
  );
}
