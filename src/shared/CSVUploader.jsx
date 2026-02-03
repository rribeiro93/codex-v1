import React, { useRef, useState } from 'react';
import { parseCsvContent } from './utils/csvParser';
import {
  mapCsvRowToTransaction,
  extractStatementMonth,
  filterNonNegativeTransactions,
  summarizeTransactions,
  resolveStatementMonthName
} from './utils/transactionNormalizer';

const createEmptyStatement = () => ({
  month: '',
  monthName: '',
  totalAmount: 0,
  totalTransactions: 0,
  transactions: []
});

export default function CSVUploader() {
  const fileInputRef = useRef(null);
  const [statement, setStatement] = useState(createEmptyStatement);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const resetStatement = () => {
    setStatement(createEmptyStatement());
    setSuccessMessage('');
  };

  const persistStatement = async (payload, sourceFileName) => {
    if (typeof fetch !== 'function') {
      return;
    }

    setIsSaving(true);
    setSuccessMessage('');

    try {
      const response = await fetch('/api/statements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...payload,
          fileName: sourceFileName
        })
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const body = await response.json();
      const identifier =
        body && typeof body.statementId === 'string' ? body.statementId : '';
      const persistedTransactions =
        body && Number.isFinite(body.totalTransactions)
          ? body.totalTransactions
          : payload.totalTransactions;

      const message = identifier
        ? `Salvei ${persistedTransactions} transações no banco de dados (id ${identifier}).`
        : `Salvei ${persistedTransactions} transações no banco de dados.`;

      setSuccessMessage(message);
    } catch (err) {
      console.error('Falha ao salvar o extrato', err);
      setError('Não foi possível salvar o extrato no banco de dados. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelection = async (event) => {
    const [file] = event.target.files ?? [];
    if (!file) {
      return;
    }

    setError('');
    setSuccessMessage('');
    resetStatement();
    setFileName(file.name);

    try {
      const text = await file.text();
      const rows = parseCsvContent(text);
      const dataRows = rows.slice(1);

      if (!dataRows.length) {
        setError('Nenhuma linha de dados foi encontrada no arquivo CSV enviado.');
        return;
      }

      const transactions = dataRows.map(mapCsvRowToTransaction);
      const payableTransactions = filterNonNegativeTransactions(transactions);

      if (!payableTransactions.length) {
        setError('Nenhuma linha com valor não negativo foi encontrada no arquivo CSV enviado.');
        return;
      }

      const month = extractStatementMonth(file.name);
      const { totalAmount, totalTransactions } = summarizeTransactions(payableTransactions);
      const monthName = resolveStatementMonthName({
        month,
        fileName: file.name,
        transactions: payableTransactions
      });

      const statementPayload = {
        month,
        monthName,
        totalAmount,
        totalTransactions,
        transactions: payableTransactions
      };

      setStatement(statementPayload);
      await persistStatement(statementPayload, file.name);
    } catch (err) {
      setError('Não foi possível ler o arquivo selecionado. Tente novamente.');
      console.error(err);
    } finally {
      event.target.value = '';
    }
  };

  return (
    <section style={styles.card}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileSelection}
        style={{ display: 'none' }}
      />
      <div style={styles.info}>
        <h2 style={styles.title}>Importar CSV</h2>
        <p style={styles.subtitle}>
          Selecione um arquivo CSV com até cinco colunas para visualizar uma prévia em JSON.
        </p>
        <button type="button" onClick={openFilePicker} style={styles.button}>
          Escolher arquivo
        </button>
        {fileName && <p style={styles.fileName}>Selecionado: {fileName}</p>}
        {isSaving && <p style={styles.status}>Salvando extrato no banco de dados...</p>}
        {successMessage && <p style={styles.success}>{successMessage}</p>}
        {error && <p style={styles.error}>{error}</p>}
      </div>
      <div style={styles.preview}>
        {!!statement.transactions.length ? (
          <pre style={styles.output}>{JSON.stringify(statement, null, 2)}</pre>
        ) : (
          <div style={styles.placeholder}>
            <p style={styles.placeholderText}>Envie um arquivo para ver a prévia aqui.</p>
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
  status: {
    margin: 0,
    color: '#7dd3fc'
  },
  success: {
    margin: 0,
    color: '#4ade80'
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
