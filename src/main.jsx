import React, { useState, useEffect, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const LazyWeb3Provider = React.lazy(() => import('./components/Web3Provider.jsx'));

function AppWrapper() {
  const [loadWeb3, setLoadWeb3] = useState(false);

  useEffect(() => {
    // Delay loading the heavy Web3/Consensus bundle (Wagmi/Viem/RainbowKit) by 1.5s
    // to let the guest dashboard render and respond instantly.
    const timer = setTimeout(() => {
      setLoadWeb3(true);
    }, 1500);
    return () => clearTimeout(timer);
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
