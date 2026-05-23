import { useGameStore } from '../store/gameStore.js';

export default function TabBar() {
  const { activeTab, setActiveTab, hasNode } = useGameStore();

  const TABS = [
    { id: 'earn',      icon: '⛏️', label: 'Tap' },
    { id: 'mine',      icon: '🚀', label: hasNode ? 'Boost' : 'Nodes' },
    { id: 'tasks',     icon: '✅', label: 'Tasks' },
    { id: 'friends',   icon: '👥', label: 'Friends' },
    { id: 'team',      icon: '🕸️', label: 'Network' },
  ];

  return (
    <nav className="rpg-chunky-tabs">
      {TABS.map(t => (
        <button
          key={t.id}
          className={`rpg-chunky-tab-item ${activeTab === t.id ? 'active' : ''}`}
          onClick={() => setActiveTab(t.id)}
        >
          <span className="rpg-chunky-tab-icon">{t.icon}</span>
          <span className="rpg-chunky-tab-label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

