import { useState, useEffect } from 'react';
import { blockchain } from '../services/blockchain.js';

let _cachedPrice = 0;
let _subscriberCount = 0;
const _listeners = new Set();

const notifyAll = (price) => _listeners.forEach(fn => fn(price));

/**
 * Shared BNB/USD price hook — reads from the on-chain AIPCore oracle.
 * Single fetch per page load, shared across all mounted consumers.
 */
export function useBnbPrice() {
  const [price, setPrice] = useState(_cachedPrice);

  useEffect(() => {
    const listener = (p) => setPrice(p);
    _listeners.add(listener);
    _subscriberCount++;

    if (_cachedPrice > 0) {
      setPrice(_cachedPrice);
    } else {
      // First subscriber triggers the fetch
      blockchain._getBnbUsdPrice().then(p => {
        _cachedPrice = p;
        notifyAll(p);
      }).catch(() => {});
    }

    return () => {
      _listeners.delete(listener);
      _subscriberCount--;
    };
  }, []);

  return price;
}

/** Formats BNB + inline $ equivalent string */
export const formatBnbUsd = (bnb, priceUsd) => {
  const bnbNum = parseFloat(bnb) || 0;
  const usd = priceUsd > 0 ? (bnbNum * priceUsd).toFixed(2) : null;
  return { bnb: bnbNum.toFixed(4), usd };
};
