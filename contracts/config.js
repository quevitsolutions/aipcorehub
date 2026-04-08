import { ethers } from "ethers";

export const CONTRACTS = {
  AIPCORE:    import.meta.env.VITE_AIPCORE_ADDRESS || "0xB6CbD70147835D4eA93B4a768D8e101B6E9A420f",
  AIPVIEW:    import.meta.env.VITE_AIPVIEW_ADDRESS || "0x8d4FBcb77EAA5260F4C5f41713c6968A197E2BDb",
  REWARDPOOL: import.meta.env.VITE_REWARD_POOL_ADDRESS || "0x319429aD1A00cbCD6aed1fFA1106eEC056316465"
};

export const BSC_CHAIN_ID = 56;
export const RPC_NODES = [
  "https://bsc-dataseed.binance.org",
  "https://rpc.ankr.com/bsc",
  "https://nodes.pancakeswap.com/bsc-mainnet",
  "https://binance.llamarpc.com"
];

// Rebuild: Resilient Fallback Provider
export const provider = new ethers.FallbackProvider(
  RPC_NODES.map(url => new ethers.JsonRpcProvider(url, undefined, { staticNetwork: true }))
);

export const getProvider = () => {
  if (window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return provider;
};

export const getSigner = async () => {
  if (!window.ethereum) throw new Error("No wallet found");
  const p = new ethers.BrowserProvider(window.ethereum);
  await p.send("eth_requestAccounts", []);
  return p.getSigner();
};

export const switchToBSC = async () => {
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
};
