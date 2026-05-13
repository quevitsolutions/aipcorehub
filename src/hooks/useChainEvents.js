/**
 * useChainEvents — subscribes to the server-side SSE stream (/api/events/stream)
 * and reacts to real-time blockchain events by refreshing store data and
 * showing toast notifications to the user.
 */
import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore.js';

// ── Tiny toast system ─────────────────────────────────────────────────────────
let _toastRoot = null;
function getToastRoot() {
  if (_toastRoot) return _toastRoot;
  _toastRoot = document.createElement('div');
  _toastRoot.id = 'chain-event-toasts';
  Object.assign(_toastRoot.style, {
    position: 'fixed', bottom: '80px', left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 99999, display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '8px', pointerEvents: 'none',
    width: '92vw', maxWidth: '380px',
  });
  document.body.appendChild(_toastRoot);
  return _toastRoot;
}

function showToast(icon, title, body, color = '#4FC3F7') {
  const root = getToastRoot();
  const el = document.createElement('div');
  Object.assign(el.style, {
    background: 'rgba(10,14,20,0.96)',
    border: `1px solid ${color}55`,
    borderLeft: `3px solid ${color}`,
    borderRadius: '10px',
    padding: '10px 14px',
    display: 'flex', gap: '10px', alignItems: 'flex-start',
    boxShadow: `0 4px 20px rgba(0,0,0,0.6)`,
    animation: 'slideUp 0.3s ease',
    width: '100%', boxSizing: 'border-box',
  });
  el.innerHTML = `
    <span style="font-size:18px;line-height:1">${icon}</span>
    <div style="flex:1">
      <div style="font-size:11px;font-weight:900;color:${color};letter-spacing:0.5px">${title}</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.7);margin-top:2px;font-weight:600">${body}</div>
    </div>`;
  root.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.5s';
    setTimeout(() => el.remove(), 500);
  }, 4500);
}

// Inject keyframe animation once
if (!document.getElementById('chain-toast-style')) {
  const s = document.createElement('style');
  s.id = 'chain-toast-style';
  s.textContent = `@keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }`;
  document.head.appendChild(s);
}
// ─────────────────────────────────────────────────────────────────────────────

const SSE_URL = '/api/events/stream';
const RECONNECT_DELAY_MS = 5000;

export function useChainEvents() {
  const esRef        = useRef(null);
  const reconnectRef = useRef(null);
  const store        = useGameStore();
  const walletAddress = store.walletAddress;
  const nodeId        = store.nodeId;

  // Callbacks to refresh store data
  const refreshDashboard = useCallback(() => {
    if (store.fetchUserData) store.fetchUserData().catch(() => {});
  }, [store]);

  const refreshTeam = useCallback(() => {
    if (store.fetchTeamHistory) store.fetchTeamHistory().catch(() => {});
  }, [store]);

  const connect = useCallback(() => {
    if (esRef.current) esRef.current.close();

    const es = new EventSource(SSE_URL);
    esRef.current = es;

    es.onopen = () => {
      console.log('[ChainEvents] SSE connected');
    };

    es.onmessage = (e) => {
      let data;
      try { data = JSON.parse(e.data); } catch { return; }

      const { type, payload } = data;
      if (!type || type === 'connected') return;

      const myWallet  = (walletAddress || '').toLowerCase();
      const myNodeId  = Number(nodeId || 0);
      const isForMe   = myWallet && (
        payload?.wallet === myWallet ||
        payload?.nodeId === myNodeId ||
        payload?.sponsorId === myNodeId
      );

      switch (type) {
        // ── New node registered on-chain ──────────────────────────────────────
        case 'node_created': {
          const { nodeId: nId, wallet, tier, sponsorId } = payload;
          const shortW = wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : '';
          if (sponsorId === myNodeId) {
            // My direct referral just registered!
            showToast('🎉', 'NEW DIRECT REFERRAL', `Node #${nId} (T${tier}) joined under you!  ${shortW}`, '#A3FF12');
            refreshTeam();
            refreshDashboard();
          } else {
            showToast('🌐', 'NETWORK GREW', `Node #${nId} (T${tier}) joined the matrix.`, '#4FC3F7');
            // Only refresh team if the new node could be in my downline
            if (isForMe) refreshTeam();
          }
          break;
        }

        // ── Tier upgrade ──────────────────────────────────────────────────────
        case 'tier_unlocked': {
          const { nodeId: nId, tier, wallet } = payload;
          const shortW = wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : '';
          if (nId === myNodeId) {
            showToast('🚀', 'TIER UPGRADED!', `Your node is now Tier ${tier}!`, '#FFD700');
            refreshDashboard();
          } else {
            showToast('⬆️', 'TEAM MEMBER UPGRADED', `Node #${nId} upgraded to T${tier}  ${shortW}`, '#FF9800');
            if (isForMe) refreshTeam();
          }
          break;
        }

        // ── Reward pushed to wallet ───────────────────────────────────────────
        case 'reward_distributed': {
          const { nodeId: nId, amountBnb, layer, isMissed } = payload;
          if (nId === myNodeId && !isMissed) {
            showToast('💰', 'REWARD RECEIVED', `+${amountBnb.toFixed(6)} BNB from layer ${layer + 1}`, '#A3FF12');
            refreshDashboard();
          }
          break;
        }

        // ── Pool reward claimed ───────────────────────────────────────────────
        case 'reward_claimed': {
          const { nodeId: nId, amountBnb } = payload;
          if (nId === myNodeId) {
            showToast('🏆', 'POOL REWARD CLAIMED', `${amountBnb.toFixed(6)} BNB claimed from pool`, '#4FC3F7');
            refreshDashboard();
          }
          break;
        }

        default: break;
      }
    };

    es.onerror = () => {
      console.warn('[ChainEvents] SSE disconnected — reconnecting in', RECONNECT_DELAY_MS, 'ms');
      es.close();
      esRef.current = null;
      reconnectRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };
  }, [walletAddress, nodeId, refreshDashboard, refreshTeam]);

  useEffect(() => {
    connect();
    return () => {
      if (esRef.current) esRef.current.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [connect]);
}
