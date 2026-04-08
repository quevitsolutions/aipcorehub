import { useGameStore } from '../store/gameStore.js';

export default function TabBar() {
  const { activeTab, setActiveTab } = useGameStore();

  const TABS = [
    { id: 'friends',   icon: '👥', label: 'Friends' },
    { id: 'team',      icon: '🕸️', label: 'Team' },
    { id: 'earn',      icon: '⛏️', label: 'Earn' },
    { id: 'mine',      icon: '🚀', label: 'Boost' },
    { id: 'contracts', icon: '📄', label: 'Docs' },
    { id: 'dash',      icon: '👤', label: 'Stats' },
  ];

  return (
    <nav className="mobile-tabs">
      {TABS.map(t => (
        <button
          key={t.id}
          className={`tab-item ${activeTab === t.id ? 'active' : ''}`}
          onClick={() => setActiveTab(t.id)}
        >
          {t.badge && <div className="badge-red">{t.badge}</div>}
          <span className="tab-icon">{t.icon}</span>
          <span className="tab-label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
