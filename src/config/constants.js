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
