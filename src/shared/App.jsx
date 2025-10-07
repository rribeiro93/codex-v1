import CSVUploader from './CSVUploader';

export default function App() {
  return (
    <main style={styles.container}>
      <h1 style={styles.heading}>CSV to JSON previewer</h1>
      <p style={styles.message}>
        Upload a CSV file to instantly view its contents mapped to the required
        JSON format.
      </p>
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
  }
};
