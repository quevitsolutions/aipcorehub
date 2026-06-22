import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const LazyWeb3Provider = React.lazy(() => import('./components/Web3Provider.jsx'));

function AppWrapper() {
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
