if (typeof global === 'undefined') { window.global = window; }
import { ethers } from "ethers";
import { createAppKit } from '@reown/appkit/react'; 
import { EthersAdapter } from '@reown/appkit-adapter-ethers';

export const CONTRACTS = {
  AIPCORE:    "0xB6CbD70147835D4eA93B4a768D8e101B6E9A420f",
  AIPVIEW:    "0x8d4FBcb77EAA5260F4C5f41713c6968A197E2BDb",
  REWARDPOOL: "0x319429aD1A00cbCD6aed1fFA1106eEC056316465"
};

export const BSC_CHAIN_ID = 56;

export const RPC_NODES = [
  import.meta.env.VITE_BSC_MAINNET_RPC || "https://bsc-dataseed.binance.org",
  "https://binance.llamarpc.com",
  "https://bsc-dataseed1.defibit.io",
  "https://1rpc.io/bnb",
  "https://rpc.ankr.com/bsc"
];

const projectId = import.meta.env.VITE_PROJECT_ID || 'ad615b7c3d0dc4e3aee306104d15c745';

const bscChain = {
  chainId: BSC_CHAIN_ID,
  name: 'BNB Smart Chain',
  currency: 'BNB',
  explorerUrl: 'https://bscscan.com',
  rpcUrl: RPC_NODES[0]
};

const metadata = {
  name: 'AIPCore Hub',
  description: 'Mining Interface',
  url: 'https://aipcore.online',
  icons: ['https://aipcore.online/favicon.ico']
};

// Explicit Adapter Instantiation
const ethersAdapter = new EthersAdapter();

// Core AppKit Initialization (Stability Fix for "Adapter not found")
export const modal = createAppKit({
  adapters: [ethersAdapter],
  networks: [bscChain],
  metadata,
  projectId,
  features: {
    analytics: true,
    allWallets: true,
    email: false,
    socials: false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#A3FF12',
    '--w3m-z-index': 9999
  }
});

export const provider = new ethers.JsonRpcProvider(RPC_NODES[0]);
export const getProvider = () => provider;

export const getSigner = async () => {
  const { walletProvider } = modal.getWalletProvider();
  if (!walletProvider) throw new Error("Wallet not connected");
  const browserProvider = new ethers.BrowserProvider(walletProvider);
  return browserProvider.getSigner();
};
