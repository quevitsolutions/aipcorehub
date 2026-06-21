import React, { useEffect, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { useGameStore } from './store/gameStore.js';

const LazyWeb3Provider = React.lazy(() => import('./components/Web3Provider.jsx'));

// Check if localStorage has any Wagmi/WalletConnect traces indicating a previously connected session
const hasRecentWalletConnection = () => {
  if (typeof window === 'undefined') return false;
  try {
    const keys = Object.keys(localStorage);
    return keys.some(key => key.startsWith('wagmi') || key.includes('recentConnectorId'));
  } catch {
    return false;
  }
};

function AppWrapper() {
  const loadWeb3 = useGameStore(s => s.loadWeb3);

  useEffect(() => {
    // If user has a returning connected session, trigger loadWeb3 immediately.
    // Otherwise, we do not set loadWeb3 to true on boot. It will only load on-demand
    // when they click "Connect Wallet" or perform an on-chain write transaction.
    if (hasRecentWalletConnection()) {
      useGameStore.setState({ loadWeb3: true });
    }
  }, []);

  if (!loadWeb3) {
    return <App />;
  }

  return (
    <Suspense fallback={<App />}>
      <LazyWeb3Provider>
        <App />
      </LazyWeb3Provider>
    </Suspense>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
