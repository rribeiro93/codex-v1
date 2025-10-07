import { useRef, useState } from 'react';

function parseCsv(text) {
  const rows = [];
  let current = [];
  let field = '';
  let inQuotes = false;

  const pushField = () => {
    current.push(field);
    field = '';
  };

  const pushRow = () => {
    if (current.length > 0 || field !== '') {
      pushField();
      rows.push(current);
    }
    current = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      pushField();
    } else if (char === '\n') {
      pushRow();
    } else if (char === '\r') {
      if (nextChar === '\n') {
        pushRow();
        i += 1;
      } else {
        pushRow();
      }
    } else {
      field += char;
    }
  }

  if (field !== '' || current.length) {
    pushField();
    rows.push(current);
  }

  return rows.filter((row) => row.some((value) => value.trim() !== ''));
}

function toEntry(row) {
  return {
    date: row[0] ?? '',
    place: row[1] ?? '',
    name: row[2] ?? '',
    price: row[3] ?? '',
    installments: row[4] ?? ''
  };
}

export default function CSVUploader() {
  const inputRef = useRef(null);
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleFile = async (event) => {
    const [file] = event.target.files ?? [];
    if (!file) {
      return;
    }

    setError('');
    setEntries([]);
    setFileName(file.name);

    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (!rows.length) {
        setError('No data rows found in the provided CSV file.');
        return;
      }
      const mapped = rows.map(toEntry);
      setEntries(mapped);
    } catch (err) {
      setError('Failed to read the selected file. Please try again.');
      console.error(err);
    } finally {
      event.target.value = '';
    }
  };

  return (
    <section style={styles.card}>
      <h2 style={styles.title}>Upload CSV</h2>
      <p style={styles.subtitle}>
        Select a CSV file with up to five columns to preview it as JSON.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
      <button type="button" onClick={handleClick} style={styles.button}>
        Choose file
      </button>
      {fileName && <p style={styles.fileName}>Selected: {fileName}</p>}
      {error && <p style={styles.error}>{error}</p>}
      {!!entries.length && (
        <pre style={styles.output}>{JSON.stringify(entries, null, 2)}</pre>
      )}
    </section>
  );
}

const styles = {
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    padding: '2rem',
    borderRadius: '1rem',
    boxShadow: '0 20px 45px rgba(15, 23, 42, 0.45)',
    width: 'min(640px, 100%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    alignItems: 'center',
    color: '#f8fafc'
  },
  title: {
    fontSize: '2rem',
    margin: 0
  },
  subtitle: {
    margin: 0,
    textAlign: 'center',
    color: '#cbd5f5'
  },
  button: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    borderRadius: '9999px',
    border: 'none',
    backgroundColor: '#38bdf8',
    color: '#0f172a',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  },
  fileName: {
    margin: 0,
    color: '#facc15'
  },
  error: {
    margin: 0,
    color: '#f87171'
  },
  output: {
    width: '100%',
    backgroundColor: '#020617',
    borderRadius: '0.75rem',
    padding: '1rem',
    textAlign: 'left',
    maxHeight: '320px',
    overflow: 'auto',
    fontSize: '0.9rem',
    lineHeight: 1.5,
    border: '1px solid rgba(148, 163, 184, 0.25)'
  }
};
