import React, { useState } from 'react';
import Upload from './upload/Upload';
import Categories from './categories/Categories';
import Summary from './summary/Summary';

type MenuItemId = 'upload' | 'summary' | 'categorySummary' | 'categories';

const menuItems: ReadonlyArray<{ id: MenuItemId; label: string }> = [
  { id: 'upload', label: 'Upload' },
  { id: 'summary', label: 'Resumo' },
  { id: 'categories', label: 'Categorias' }
];

export default function App() {
  const [activePage, setActivePage] = useState<MenuItemId>('upload');
  const [hoveredItem, setHoveredItem] = useState<MenuItemId | ''>('');

  const renderActivePage = () => {
    if (activePage === 'summary') {
      return <Summary />;
    }
    if (activePage === 'categories') {
      return <Categories />;
    }
    return <Upload />;
  };

  return (
    <div style={styles.app}>
      <header style={styles.topNav}>
        <nav aria-label="Navegação principal" style={styles.nav}>
          <ul style={styles.navList}>
            {menuItems.map((item) => {
              const isActive = item.id === activePage;
              const isHovered = item.id === hoveredItem;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    style={{
                      ...styles.navButton,
                      ...(isHovered && !isActive ? styles.navButtonHover : null),
                      ...(isActive ? styles.navButtonActive : null)
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
      </header>
      <main style={styles.content}>{renderActivePage()}</main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(135deg, #293e49 0%, #1f2f37 100%)',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: '#f8fafc'
  },
  topNav: {
    position: 'sticky',
    top: 0,
    zIndex: 5,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 14, 24, 0.85)',
    backdropFilter: 'blur(8px)',
    borderBottom: '1px solid rgba(148, 163, 184, 0.25)'
  },
  nav: {
    width: '100%'
  },
  navList: {
    listStyle: 'none',
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    margin: 0,
    padding: 0
  },
  navButton: {
    padding: '0.5rem 1.5rem',
    border: '1px solid transparent',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    color: '#e2e8f0',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 600,
    letterSpacing: '0.01em',
    transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease'
  },
  navButtonActive: {
    backgroundColor: '#38bdf8',
    color: '#0f172a'
  },
  navButtonHover: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    color: '#f8fafc',
    borderColor: 'rgba(148, 197, 255, 0.45)'
  },
  content: {
    flex: '1 1 auto',
    padding: '3rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    overflowY: 'auto'
  }
};
