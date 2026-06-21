import { useWalletLifecycle } from '../hooks/useContract.js';
import { useChainEvents } from '../hooks/useChainEvents.js';

export default function Web3Connector() {
  useWalletLifecycle();
  useChainEvents();
  return null;
}
