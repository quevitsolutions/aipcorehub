import { useEffect } from 'react';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '../config/wagmi';
import Web3Connector from './Web3Connector.jsx';
import { useGameStore } from '../store/gameStore.js';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

export default function Web3Provider({ children }) {
  useEffect(() => {
    useGameStore.setState({ web3Loaded: true });
    return () => {
      useGameStore.setState({ web3Loaded: false });
    };
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#A3FF12',
          accentColorForeground: 'black',
          borderRadius: 'large',
          fontStack: 'system',
          overlayBlur: 'small',
        })}>
          <Web3Connector />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
