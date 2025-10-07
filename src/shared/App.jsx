import React from 'react';
import CSVUploader from './CSVUploader';

export default function App() {
  return (
    <main style={styles.container}>
      <CSVUploader />
    </main>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)',
    color: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    textAlign: 'center',
    padding: '0 1.5rem'
  }
};
