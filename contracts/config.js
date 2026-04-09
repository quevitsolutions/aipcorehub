if (typeof global === 'undefined') { window.global = window; }
import { ethers } from "ethers";
import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';

export const CONTRACTS = {
  AIPCORE:    import.meta.env.VITE_AIPCORE_ADDRESS || "0xB6CbD70147835D4eA93B4a768D8e101B6E9A420f",
  AIPVIEW:    import.meta.env.VITE_AIPVIEW_ADDRESS || "0x8d4FBcb77EAA5260F4C5f41713c6968A197E2BDb",
  REWARDPOOL: import.meta.env.VITE_REWARD_POOL_ADDRESS || "0x319429aD1A00cbCD6aed1fFA1106eEC056316465"
};

export const BSC_CHAIN_ID = 56;

// Scalable RPC Nodes
const PRIMARY_RPC = import.meta.env.VITE_PRIMARY_RPC;
export const RPC_NODES = [
  ...(PRIMARY_RPC ? [PRIMARY_RPC] : []),
  "https://bsc-dataseed.binance.org",
  "https://rpc.ankr.com/bsc",
  "https://nodes.pancakeswap.com/bsc-mainnet",
  "https://binance.llamarpc.com"
];

export const provider = new ethers.FallbackProvider(
  RPC_NODES.map((url, index) => ({
    provider: new ethers.JsonRpcProvider(url, undefined, { staticNetwork: true }),
    priority: index === 0 ? 1 : 2,
    stallTimeout: 2000
  }))
);

// --- WalletConnect (Reown AppKit React Alignment) ---
const projectId = import.meta.env.VITE_PROJECT_ID || '85bbe92e974bca9f67c7910e0d1365ea';

const bscChain = {
  chainId: BSC_CHAIN_ID,
  name: 'BNB Smart Chain',
  currency: 'BNB',
  explorerUrl: 'https://bscscan.com',
  rpcUrl: RPC_NODES[0]
};

const metadata = {
  name: 'AIPCore Hub',
  description: 'AI-Powered Mining Dashboard',
  url: 'https://aipcore.online',
  icons: ['https://aipcore.online/favicon.ico']
};

export const modal = createAppKit({
  adapters: [new EthersAdapter()],
  networks: [bscChain],
  metadata,
  projectId,
  themeMode: 'dark',
  features: {
    analytics: true,
    allWallets: true,
    email: false,
    socials: false,
  },
  featuredWalletIds: [
    'c57ca95b47569778ef461d6ce6d376ca3005bcc040a4555986927d2446f28cfc', // MetaMask
    '4622a2b2d6af1c9844944291e5e7351a6659c037990038435f3d3d6667104a39'  // Trust Wallet
  ]
});

// Helpers
export const getProvider = () => provider;

export const getSigner = async () => {
  const { walletProvider } = modal.getWalletProvider();
  if (walletProvider) {
    const browserProvider = new ethers.BrowserProvider(walletProvider);
    return browserProvider.getSigner();
  }
  if (window.ethereum) {
    const p = new ethers.BrowserProvider(window.ethereum);
    return p.getSigner();
  }
  throw new Error("No wallet connected");
};

export const switchToBSC = async () => {
  if (window.ethereum) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }]
      });
    } catch (err) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0x38",
            chainName: "BNB Smart Chain",
            nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
            rpcUrls: ["https://bsc-dataseed.binance.org/"],
            blockExplorerUrls: ["https://bscscan.com/"]
          }]
        });
      }
    }
  }
};
