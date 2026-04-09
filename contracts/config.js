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
  "https://bsc-dataseed.binance.org",
  "https://bsc-dataseed1.defibit.io",
  "https://bsc-dataseed1.ninicoin.io"
];

const projectId = import.meta.env.VITE_PROJECT_ID || '526553896504a7495027588eaaa51614';

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

export const modal = createAppKit({
  adapters: [new EthersAdapter()],
  networks: [bscChain],
  metadata,
  projectId,
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e5a26788b', // MetaMask
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0'  // Trust Wallet
  ],
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
