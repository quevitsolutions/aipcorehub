export const formatNumber = (n) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return Number(n).toLocaleString();
};

export const shortAddr = (addr) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

export const formatBNB = (wei) => {
  try {
    return parseFloat(wei).toFixed(4) + " BNB";
  } catch {
    return "0 BNB";
  }
};

export const getRefLink = (userId) =>
  `https://t.me/AIPCoreBot?start=ref_${userId}`;

export const getWebAppRefLink = (userId) =>
  `https://t.me/AIPCoreBot/app?startapp=ref_${userId}`;

