import { useState } from 'react';

const messages = [
  'Welcome to your React SSR base project!',
  'Edit src/shared/App.jsx to get started.',
  'Server-rendered markup hydrates on the client.'
];

export default function App() {
  const [index, setIndex] = useState(0);

  const nextMessage = () => {
    setIndex((current) => (current + 1) % messages.length);
  };

  return (
    <main style={styles.container}>
      <h1 style={styles.heading}>React SSR Base</h1>
      <p style={styles.message}>{messages[index]}</p>
      <button type="button" onClick={nextMessage} style={styles.button}>
        Rotate message
      </button>
    </main>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)',
    color: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    textAlign: 'center',
    padding: '0 1.5rem'
  },
  heading: {
    fontSize: '3rem',
    marginBottom: '1rem'
  },
  message: {
    fontSize: '1.25rem',
    maxWidth: '32rem',
    marginBottom: '2rem'
  },
  button: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    borderRadius: '9999px',
    border: 'none',
    backgroundColor: '#facc15',
    color: '#0f172a',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  }
};
