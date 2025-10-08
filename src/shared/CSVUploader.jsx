import { useRef, useState } from 'react';
import React from 'react';

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
    } else if (char === ';') {
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

function toDate(value) {
  if (!value && value !== 0) {
    return '';
  }

  const formatDateParts = (year, month, day) => {
    const yyyy = String(year).padStart(4, '0');
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDateParts(
      value.getUTCFullYear(),
      value.getUTCMonth() + 1,
      value.getUTCDate()
    );
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const fromNumber = new Date(value);
    if (!Number.isNaN(fromNumber.getTime())) {
      return formatDateParts(
        fromNumber.getUTCFullYear(),
        fromNumber.getUTCMonth() + 1,
        fromNumber.getUTCDate()
      );
    }
  }

  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const match = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (!match) {
    return '';
  }

  const day = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  let year = Number.parseInt(match[3], 10);

  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return '';
  }

  if (year < 100) {
    year += 2000;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return '';
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return '';
  }

  return formatDateParts(year, month, day);
}

function toNumber(value) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string') {
    return 0;
  }

  const normalized = value.trim().replace(/[^\d,.-]/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function capitalize(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  return trimmed
    .split(/\s+/)
    .map((word) => `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(' ');
}

function toEntry(row) {
  const originalDate = row[0];
  const originalPlace = row[1] ?? '';
  const originalBy = row[2];
  const originalAmount = row[3];
  const originalInstallments = row[4] ?? '';

  return {
    date: toDate(originalDate),
    place: originalPlace,
    category: '',
    owner: capitalize(originalBy),
    amount: toNumber(originalAmount),
    installments: parseInstallments(originalInstallments)
  };
}

function parseInstallments(value) {
  if (value == null) {
    return null;
  }

  if (typeof value === 'object') {
    const maybeCurrent = Number.parseInt(value.current, 10);
    const maybeTotal = Number.parseInt(value.total, 10);

    if (Number.isFinite(maybeCurrent) && Number.isFinite(maybeTotal)) {
      return {
        current: maybeCurrent,
        total: maybeTotal
      };
    }
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === '-') {
    return null;
  }

  const match = trimmed.match(/^(\d+)\s*(?:de|\/)\s*(\d+)$/i);
  if (!match) {
    return null;
  }

  const current = Number.parseInt(match[1], 10);
  const total = Number.parseInt(match[2], 10);

  if (!Number.isFinite(current) || !Number.isFinite(total)) {
    return null;
  }

  return { current, total };
}

function extractMonthFromFileName(name) {
  if (typeof name !== 'string') {
    return '';
  }

  const match = name.match(/Fatura(\d{4}-\d{2})-\d{2}\.csv$/i);
  if (!match) {
    return '';
  }

  return match[1];
}

export default function CSVUploader() {
  const inputRef = useRef(null);
  const [entries, setEntries] = useState({
    month: '',
    totalAmount: 0,
    totalTransactions: 0,
    transactions: []
  });
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
    setEntries({
      month: '',
      totalAmount: 0,
      totalTransactions: 0,
      transactions: []
    });
    setFileName(file.name);

    try {
      const text = await file.text();
      const rows = parseCsv(text);
      const dataRows = rows.slice(1);
      if (!dataRows.length) {
        setError('No data rows found in the provided CSV file.');
        return;
      }
      const mapped = dataRows
        .map(toEntry)
        .filter((transaction) => transaction.amount >= 0);
      if (!mapped.length) {
        setError('No data rows with a non-negative amount were found in the provided CSV file.');
        return;
      }
      const month = extractMonthFromFileName(file.name);
      const totalTransactions = mapped.length;
      const totalAmount = mapped.reduce((sum, transaction) => {
        const amount = Number.isFinite(transaction.amount) ? transaction.amount : 0;
        return sum + amount;
      }, 0);
      const formattedTotalAmount = Number.parseFloat(totalAmount.toFixed(2));
      setEntries({
        month,
        totalAmount: formattedTotalAmount,
        totalTransactions,
        transactions: mapped
      });
    } catch (err) {
      setError('Failed to read the selected file. Please try again.');
      console.error(err);
    } finally {
      event.target.value = '';
    }
  };

  return (
    <section style={styles.card}>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
      <div style={styles.info}>
        <h2 style={styles.title}>Upload CSV</h2>
        <p style={styles.subtitle}>
          Select a CSV file to preview it as JSON
        </p>
        <button type="button" onClick={handleClick} style={styles.button}>
          Choose file
        </button>
        {fileName && <p style={styles.fileName}>Selected: {fileName}</p>}
        {error && <p style={styles.error}>{error}</p>}
      </div>
      <div style={styles.preview}>
        {!!entries.transactions.length ? (
          <pre style={styles.output}>{JSON.stringify(entries, null, 2)}</pre>
        ) : (
          <div style={styles.placeholder}>
            <p style={styles.placeholderText}>Upload a file to see its preview here.</p>
          </div>
        )}
      </div>
    </section>
  );
}

const styles = {
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    padding: '2rem',
    margin: '2rem',
    borderRadius: '1rem',
    boxShadow: '0 20px 45px rgba(15, 23, 42, 0.45)',
    width: 'min(960px, 100%)',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1.5rem',
    alignItems: 'stretch',
    color: '#f8fafc'
  },
  title: {
    fontSize: '2rem',
    margin: 0
  },
  subtitle: {
    margin: 0,
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
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    alignSelf: 'center'
  },
  fileName: {
    margin: 0,
    color: '#facc15'
  },
  error: {
    margin: 0,
    color: '#f87171'
  },
  info: {
    flex: '1 1 280px',
    display: 'flex',
    flexDirection: 'column',
    gap: '3rem',
    justifyContent: 'center'
  },
  preview: {
    flex: '1 1 360px',
    display: 'flex',
    alignItems: 'stretch',
    minHeight: '520px',
    width: '100%'
  },
  output: {
    width: '100%',
    backgroundColor: '#020617',
    borderRadius: '0.75rem',
    padding: '1rem',
    textAlign: 'left',
    maxHeight: '520px',
    overflow: 'auto',
    fontSize: '0.9rem',
    lineHeight: 1.5,
    border: '1px solid rgba(148, 163, 184, 0.25)'
  },
  placeholder: {
    width: '100%',
    borderRadius: '0.75rem',
    border: '1px dashed rgba(148, 163, 184, 0.4)',
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem'
  },
  placeholderText: {
    margin: 0,
    color: '#94a3b8',
    fontSize: '0.95rem',
    textAlign: 'center'
  }
};
