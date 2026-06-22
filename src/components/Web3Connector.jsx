import { useEffect } from 'react';
import { useWalletLifecycle } from '../hooks/useContract.js';
import { useChainEvents } from '../hooks/useChainEvents.js';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useGameStore } from '../store/gameStore.js';

export default function Web3Connector() {
  useWalletLifecycle();
  useChainEvents();

  const { openConnectModal } = useConnectModal();
  const triggerConnect = useGameStore(s => s.triggerConnect);

  useEffect(() => {
    if (openConnectModal) {
      useGameStore.setState({ openConnectModalFn: openConnectModal });
    }
    return () => {
      useGameStore.setState({ openConnectModalFn: null });
    };
  }, [openConnectModal]);

  useEffect(() => {
    if (triggerConnect && openConnectModal) {
      openConnectModal();
      useGameStore.setState({ triggerConnect: false });
    }
  }, [triggerConnect, openConnectModal]);

  return null;
}
