import React from 'react';
import {
  formatCurrency,
  formatInstallments,
  formatTransactionDate
} from '../utils/formatters';

function isInstallmentTransaction(installments) {
  if (!installments || typeof installments !== 'object') {
    return false;
  }

  const current = Number.parseInt(installments.current, 10);
  const total = Number.parseInt(installments.total, 10);

  if (Number.isNaN(total) || total <= 1) {
    return false;
  }

  if (Number.isNaN(current) || current <= 0) {
    return false;
  }

  return true;
}

const styles = {
  container: {
    width: '100%',
    backgroundColor: 'rgba(2, 6, 23, 0.65)',
    borderRadius: '1rem',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem'
  },
  title: {
    margin: 0,
    fontSize: '1.25rem'
  },
  loadingMessage: {
    margin: 0,
    color: '#94a3b8'
  },
  emptyMessage: {
    margin: 0,
    color: '#cbd5f5'
  },
  error: {
    margin: 0,
    color: '#f87171'
  },
  tableWrapper: {
    width: '100%',
    overflowX: 'auto',
    borderRadius: '0.75rem',
    border: '1px solid rgba(148, 163, 184, 0.2)'
  },
  table: {
    width: '100%',
    minWidth: '640px',
    borderCollapse: 'collapse'
  },
  tableHeader: {
    padding: '0.75rem 1rem',
    fontSize: '0.8rem',
    letterSpacing: '0.05em',
    borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
    color: '#94a3b8'
  },
  tableRow: {
    transition: 'background-color 0.2s ease'
  },
  tableRowEven: {
    backgroundColor: 'rgba(15, 23, 42, 0.45)'
  },
  tableRowOdd: {
    backgroundColor: 'rgba(15, 23, 42, 0.25)'
  },
  tableCell: {
    padding: '0.75rem 1rem',
    fontSize: '0.95rem',
    borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
    color: '#e2e8f0'
  },
  placeCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem'
  },
  placePrimary: {
    fontWeight: 600,
    color: '#f8fafc'
  },
  placeSecondary: {
    fontSize: '0.8rem',
    color: '#94a3b8'
  },
  headerButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '0.35rem',
    background: 'none',
    border: 'none',
    padding: 0,
    margin: 0,
    color: 'inherit',
    font: 'inherit',
    cursor: 'pointer',
    textTransform: 'inherit'
  },
  headerButtonActive: {
    color: '#38bdf8'
  },
  sortIndicator: {
    fontSize: '0.75rem',
    letterSpacing: '0.05em'
  },
  sortIndicatorHidden: {
    visibility: 'hidden'
  }
};

const columns = [
  { key: 'date', label: 'Date', isNumeric: false },
  { key: 'place', label: 'Place', isNumeric: false },
  { key: 'category', label: 'Category', isNumeric: false },
  { key: 'owner', label: 'Owner', isNumeric: false },
  { key: 'installments', label: 'Installments', isNumeric: false },
  { key: 'amount', label: 'Amount', isNumeric: true }
];

export default function TransactionsSection({
  selectedMonth,
  label,
  isLoading,
  error,
  transactions,
  hasTransactions,
  sortColumn,
  sortDirection,
  onSort
}) {
  if (!selectedMonth && !isLoading) {
    return null;
  }

  const showTable = !isLoading && !error && hasTransactions;
  const installmentStats = Array.isArray(transactions)
    ? transactions.reduce(
        (acc, transaction) => {
          if (!isInstallmentTransaction(transaction.installments)) {
            return acc;
          }

          const amount = Number(transaction.amount);
          const numericAmount = Number.isFinite(amount) ? amount : 0;

          return {
            count: acc.count + 1,
            total: acc.total + numericAmount
          };
        },
        { count: 0, total: 0 }
      )
    : { count: 0, total: 0 };

  const installmentCount = installmentStats.count;
  const installmentTotalAmount = installmentStats.total;

  const renderSortIndicator = (columnKey) => {
    const isActive = sortColumn === columnKey;
    const symbol = sortDirection === 'asc' ? '^' : 'v';
    return (
      <span
        style={{
          ...styles.sortIndicator,
          ...(isActive ? null : styles.sortIndicatorHidden)
        }}
        aria-hidden="true"
      >
        {symbol}
      </span>
    );
  };

  const getSortButtonLabel = (columnKey, columnLabel) => {
    if (sortColumn === columnKey) {
      const directionLabel = sortDirection === 'asc' ? 'ascending' : 'descending';
      return `Sort by ${columnLabel}, currently ${directionLabel}`;
    }
    return `Sort by ${columnLabel}`;
  };

  const getAriaSort = (columnKey) => {
    if (sortColumn !== columnKey) {
      return 'none';
    }
    return sortDirection === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          Transactions
          {label ? ` • ${label}` : ''}
        </h2>
        <span>{`Installments: ${installmentCount} | ${formatCurrency(installmentTotalAmount)}`}</span>
      </div>
      {isLoading && <p style={styles.loadingMessage}>Loading transactions...</p>}
      {error && !isLoading && <p style={styles.error}>{error}</p>}
      {!error && !isLoading && !hasTransactions && (
        <p style={styles.emptyMessage}>No transactions found for this month.</p>
      )}
      {showTable && (
        <div style={styles.tableWrapper}>
          <table
            style={styles.table}
            aria-label={label ? `Transactions for ${label}` : 'Transactions'}
          >
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    style={styles.tableHeader}
                    aria-sort={getAriaSort(column.key)}
                  >
                    <button
                      type="button"
                      onClick={() => onSort(column.key)}
                      aria-label={getSortButtonLabel(column.key, column.label)}
                      style={{
                        ...styles.headerButton,
                        ...(sortColumn === column.key ? styles.headerButtonActive : null)
                      }}
                    >
                      <span>{column.label}</span>
                      {renderSortIndicator(column.key)}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, index) => {
                const cleanName =
                  typeof transaction.cleanName === 'string' ? transaction.cleanName.trim() : '';
                const placeValue =
                  typeof transaction.place === 'string' ? transaction.place.trim() : '';
                const primaryPlace = cleanName || placeValue || 'N/A';
                const showOriginal = cleanName && placeValue && cleanName !== placeValue;

                return (
                  <tr
                    key={transaction.id || `${transaction.date}-${index}`}
                    style={{
                      ...styles.tableRow,
                      ...(index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd)
                    }}
                  >
                    <td style={styles.tableCell}>{formatTransactionDate(transaction.date)}</td>
                    <td style={styles.tableCell}>
                      <div style={styles.placeCell}>
                        <span style={styles.placePrimary}>{primaryPlace}</span>
                        {showOriginal && (
                          <span style={styles.placeSecondary}>Original: {placeValue}</span>
                        )}
                      </div>
                    </td>
                    <td style={styles.tableCell}>{transaction.category || 'N/A'}</td>
                    <td style={styles.tableCell}>{transaction.owner || 'N/A'}</td>
                    <td style={styles.tableCell}>{formatInstallments(transaction.installments)}</td>
                    <td style={styles.tableCell}>{formatCurrency(transaction.amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
