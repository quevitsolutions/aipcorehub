const TICKER_ITEMS = [
  { label: 'ACTIVE MINERS', value: '12,489+' },
  { label: 'PROTOCOL VOLUME', value: '2,841 BNB' },
  { label: 'INCOME STREAMS', value: '4 TYPES' },
  { label: 'MINING RATE', value: 'UP TO 200🪙/HR' },
  { label: 'SPONSOR BONUS', value: '10% BNB' },
  { label: 'MATRIX DEPTH', value: '18 LEVELS' },
  { label: 'GLOBAL POOL', value: '5% SHARE' },
  { label: 'NETWORK NODES', value: '8,200+ ACTIVE' },
  { label: 'SMART CONTRACT', value: 'AUDITED ✓' },
  { label: 'CHAIN', value: 'BNB SMART CHAIN' },
]

// Duplicate for seamless loop
const ALL = [...TICKER_ITEMS, ...TICKER_ITEMS]

export default function TickerBar() {
  return (
    <div style={{
      position: 'fixed', top: 70, left: 0, right: 0, zIndex: 900,
      background: 'rgba(203,255,1,0.06)',
      borderBottom: '1px solid rgba(203,255,1,0.15)',
      backdropFilter: 'blur(8px)',
      overflow: 'hidden',
      height: 34,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        animation: 'ticker 40s linear infinite',
        whiteSpace: 'nowrap',
        width: 'max-content',
        gap: 0,
      }}>
        {ALL.map((item, i) => (
          <div key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '0 28px',
            borderRight: '1px solid rgba(203,255,1,0.12)',
          }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(203,255,1,0.6)', letterSpacing: 1.5 }}>
              {item.label}
            </span>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#CBFF01' }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
