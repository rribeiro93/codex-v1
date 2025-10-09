import React, { useState } from 'react';
import CSVUploader from './CSVUploader';
import MonthlySummary from './MonthlySummary';

const menuItems = [
  { id: 'upload', label: 'Upload CSV' },
  { id: 'summary', label: 'Monthly Summary' }
];

export default function App() {
  const [activePage, setActivePage] = useState('upload');

  const renderActivePage = () => {
    if (activePage === 'summary') {
      return <MonthlySummary />;
    }
    return <CSVUploader />;
  };

  return (
    <main style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.appTitle}>Fatura Insights</h1>
        <nav style={styles.menu}>
          {menuItems.map((item) => {
            const isActive = item.id === activePage;
            return (
              <button
                key={item.id}
                type="button"
                style={{
                  ...styles.menuButton,
                  ...(isActive ? styles.menuButtonActive : null)
                }}
                onClick={() => setActivePage(item.id)}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>
      <section style={styles.page}>{renderActivePage()}</section>
    </main>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #293e49 0%, #1f2f37 100%)',
    color: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    textAlign: 'center',
    padding: '2rem 1.5rem',
    gap: '3rem'
  },
  header: {
    width: 'min(960px, 100%)',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    alignItems: 'center'
  },
  appTitle: {
    margin: 0,
    fontSize: '2.5rem'
  },
  menu: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  menuButton: {
    padding: '0.75rem 1.5rem',
    borderRadius: '9999px',
    border: '1px solid rgba(148, 163, 184, 0.4)',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    color: '#e2e8f0',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'background-color 0.2s ease, transform 0.2s ease'
  },
  menuButtonActive: {
    backgroundColor: '#38bdf8',
    color: '#0f172a',
    transform: 'translateY(-2px)'
  },
  page: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    paddingBottom: '2rem'
  }
};
