import React, { useState } from 'react';
import CSVUploader from './CSVUploader';
import MonthlySummary from './MonthlySummary';

const menuItems = [
  { id: 'upload', label: 'Upload CSV' },
  { id: 'summary', label: 'Monthly Summary' }
];

export default function App() {
  const [activePage, setActivePage] = useState('upload');
  const [hoveredItem, setHoveredItem] = useState('');

  const renderActivePage = () => {
    if (activePage === 'summary') {
      return <MonthlySummary />;
    }
    return <CSVUploader />;
  };

  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div>
          <h1 style={styles.logo}>Fatura Insights</h1>
          <p style={styles.logoSubtitle}>Manage and visualize your statements</p>
        </div>
        <nav aria-label="Main navigation" style={styles.menu}>
          <ul style={styles.menuList}>
            {menuItems.map((item) => {
              const isActive = item.id === activePage;
              const isHovered = item.id === hoveredItem;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    style={{
                      ...styles.menuButton,
                      ...(isHovered && !isActive ? styles.menuButtonHover : null),
                      ...(isActive ? styles.menuButtonActive : null)
                    }}
                    onClick={() => setActivePage(item.id)}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem('')}
                    onFocus={() => setHoveredItem(item.id)}
                    onBlur={() => setHoveredItem('')}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      <section style={styles.content}>{renderActivePage()}</section>
    </div>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    background: 'linear-gradient(135deg, #293e49 0%, #1f2f37 100%)',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: '#f8fafc'
  },
  sidebar: {
    width: '280px',
    minHeight: '100vh',
    backgroundColor: 'rgba(9, 14, 24, 0.88)',
    padding: '2.75rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2.5rem',
    borderRight: '1px solid rgba(148, 163, 184, 0.15)',
    boxShadow: '4px 0 35px rgba(8, 15, 26, 0.35)'
  },
  logo: {
    margin: 0,
    fontSize: '1.95rem',
    letterSpacing: '-0.01em'
  },
  logoSubtitle: {
    margin: '0.75rem 0 0',
    fontSize: '0.9rem',
    color: '#94a3b8',
    lineHeight: 1.4
  },
  menu: {
    flexGrow: 1
  },
  menuList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    margin: 0,
    padding: 0
  },
  menuButton: {
    width: '100%',
    padding: '0.85rem 1rem',
    borderRadius: '0.9rem',
    border: '1px solid rgba(148, 163, 184, 0.25)',
    backgroundColor: 'transparent',
    color: '#e2e8f0',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 600,
    textAlign: 'left',
    transition:
      'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease',
    position: 'relative',
    overflow: 'hidden'
  },
  menuButtonActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
    color: '#38bdf8',
    transform: 'translateX(4px)',
    boxShadow: '0 12px 24px rgba(56, 189, 248, 0.25)'
  },
  menuButtonHover: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: 'rgba(148, 197, 255, 0.55)',
    color: '#f8fafc',
    transform: 'translateX(2px)'
  },
  content: {
    flex: '1 1 auto',
    minHeight: '100vh',
    padding: '3rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    overflowY: 'auto'
  }
};
