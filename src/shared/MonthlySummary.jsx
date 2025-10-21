import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
});

const initialState = {
  data: [],
  years: [],
  selectedYear: '',
  selectedMonth: '',
  selectedMonthLabel: '',
  transactions: [],
  isLoading: false,
  isTransactionsLoading: false,
  error: '',
  transactionsError: '',
  sortColumn: '',
  sortDirection: 'asc'
};

export default function MonthlySummary() {
  const [state, setState] = useState(initialState);

  const {
    data,
    years,
    selectedYear,
    selectedMonth,
    selectedMonthLabel,
    transactions,
    isLoading,
    isTransactionsLoading,
    error,
    transactionsError,
    sortColumn,
    sortDirection
  } = state;

  const loadSummary = async (year) => {
    if (typeof fetch !== 'function') {
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: '',
      transactionsError: '',
      isTransactionsLoading: false,
      transactions: [],
      selectedMonth: '',
      selectedMonthLabel: '',
      sortColumn: '',
      sortDirection: 'asc',
      ...(typeof year === 'string' && year ? { selectedYear: year } : {})
    }));

    try {
      const query = typeof year === 'string' && year ? `?year=${encodeURIComponent(year)}` : '';
      const response = await fetch(`/api/statements/summary${query}`);
      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const body = await response.json();
      const summary = Array.isArray(body.summary) ? body.summary : [];
      const responseYears = Array.isArray(body.years)
        ? body.years.map((value) => String(value))
        : [];
      const responseSelectedYear =
        typeof body.selectedYear === 'string' ? body.selectedYear : '';
      const normalizedSelectedYear =
        responseSelectedYear && responseYears.includes(responseSelectedYear)
          ? responseSelectedYear
          : responseYears[0] ?? '';

      const normalized = summary.map((item) => {
        const month = typeof item.month === 'string' && item.month ? item.month : 'Unknown';
        const monthName =
          typeof item.monthName === 'string' && item.monthName ? item.monthName : 'Unknown';
        const totalAmount =
          typeof item.totalAmount === 'number' && Number.isFinite(item.totalAmount)
            ? item.totalAmount
            : 0;
        const displayMonth = monthName !== 'Unknown' ? monthName : month;

        return {
          month,
          monthName,
          displayMonth,
          totalAmount
        };
      });

      setState((prev) => ({
        ...prev,
        data: normalized,
        years: responseYears,
        selectedYear: normalizedSelectedYear,
        isLoading: false,
        error: '',
        transactions: [],
        transactionsError: '',
        selectedMonth: '',
        selectedMonthLabel: '',
        isTransactionsLoading: false,
        sortColumn: '',
        sortDirection: 'asc'
      }));
    } catch (err) {
      console.error('Failed to load monthly summary', err);
      setState((prev) => ({
        ...prev,
        data: [],
        years: [],
        selectedYear: '',
        selectedMonth: '',
        selectedMonthLabel: '',
        transactions: [],
        isLoading: false,
        isTransactionsLoading: false,
        error: 'Unable to load monthly totals. Please try again.',
        transactionsError: '',
        sortColumn: '',
        sortDirection: 'asc'
      }));
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const hasData = data.length > 0;
  const hasYears = years.length > 0;
  const hasTransactions = transactions.length > 0;

  const formatTransactionDate = (value) => {
    if (typeof value !== 'string' || !value) {
      return 'N/A';
    }

    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) {
      return value;
    }

    try {
      return dateFormatter.format(new Date(parsed));
    } catch (err) {
      console.error('Failed to format transaction date', err);
    }
    return value;
  };

  const formatInstallments = (installments) => {
    if (!installments || typeof installments !== 'object') {
      return 'N/A';
    }

    const current = Number.parseInt(installments.current, 10);
    const total = Number.parseInt(installments.total, 10);

    if (Number.isNaN(current) || Number.isNaN(total) || total <= 1) {
      return 'N/A';
    }

    return `${current}/${total}`;
  };

  const loadTransactions = async (monthValue, displayLabel) => {
    if (typeof fetch !== 'function') {
      return;
    }

    const targetMonth = typeof monthValue === 'string' ? monthValue : '';
    if (!targetMonth) {
      return;
    }

    if (
      targetMonth === selectedMonth &&
      hasTransactions &&
      !transactionsError &&
      !isTransactionsLoading
    ) {
      return;
    }

    setState((prev) => ({
      ...prev,
      selectedMonth: targetMonth,
      selectedMonthLabel: displayLabel || prev.selectedMonthLabel || '',
      transactions: [],
      transactionsError: '',
      isTransactionsLoading: true,
      sortColumn: '',
      sortDirection: 'asc'
    }));

    try {
      const response = await fetch(
        `/api/statements/transactions?month=${encodeURIComponent(targetMonth)}`
      );
      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const body = await response.json();
      const payloadTransactions = Array.isArray(body.transactions) ? body.transactions : [];
      const normalizedMonthName =
        typeof body.monthName === 'string' && body.monthName.trim()
          ? body.monthName.trim()
          : '';

      const normalizedTransactions = payloadTransactions.map((transaction, index) => {
        const date = typeof transaction.date === 'string' ? transaction.date : '';
        const place = typeof transaction.place === 'string' ? transaction.place : '';
        const category =
          typeof transaction.category === 'string' ? transaction.category : '';
        const owner = typeof transaction.owner === 'string' ? transaction.owner : '';
        const amount =
          typeof transaction.amount === 'number' && Number.isFinite(transaction.amount)
            ? transaction.amount
            : 0;
        const statementId =
          typeof transaction.statementId === 'string' ? transaction.statementId : '';
        const fileName = typeof transaction.fileName === 'string' ? transaction.fileName : '';

        const normalizedInstallments = (() => {
          if (!transaction.installments || typeof transaction.installments !== 'object') {
            return null;
          }
          const current = Number.parseInt(transaction.installments.current, 10);
          const total = Number.parseInt(transaction.installments.total, 10);
          if (Number.isNaN(current) || Number.isNaN(total)) {
            return null;
          }
          return { current, total };
        })();

        return {
          id: statementId ? `${statementId}-${index}` : `${targetMonth}-${index}`,
          date,
          place,
          category,
          owner,
          amount,
          installments: normalizedInstallments,
          fileName
        };
      });

      const finalLabelBase = normalizedMonthName || displayLabel || targetMonth;
      const finalLabel =
        selectedYear && finalLabelBase && !finalLabelBase.includes(selectedYear)
          ? `${finalLabelBase} ${selectedYear}`
          : finalLabelBase;

      setState((prev) => ({
        ...prev,
        selectedMonth: targetMonth,
        selectedMonthLabel: finalLabel,
        transactions: normalizedTransactions,
        transactionsError: '',
        isTransactionsLoading: false,
        sortColumn: '',
        sortDirection: 'asc'
      }));
    } catch (err) {
      console.error('Failed to load transactions for month', err);
      setState((prev) => ({
        ...prev,
        transactions: [],
        isTransactionsLoading: false,
        transactionsError: 'Unable to load transactions. Please try again.',
        sortColumn: '',
        sortDirection: 'asc'
      }));
    }
  };

  const handleBarClick = (barData) => {
    if (!barData) {
      return;
    }

    const payload = typeof barData.payload === 'object' ? barData.payload : barData;
    if (!payload || typeof payload !== 'object') {
      return;
    }

    const monthValue =
      typeof payload.month === 'string' && payload.month ? payload.month : '';
    if (!monthValue) {
      return;
    }

    if (isTransactionsLoading && monthValue === selectedMonth) {
      return;
    }

    const display =
      (typeof payload.displayMonth === 'string' && payload.displayMonth) ||
      (typeof payload.monthName === 'string' && payload.monthName) ||
      monthValue;

    const label =
      selectedYear && display && !display.includes(selectedYear)
        ? `${display} ${selectedYear}`
        : display;

    loadTransactions(monthValue, label);
  };

  const handleYearClick = (nextYear) => {
    if (!nextYear || nextYear === selectedYear) {
      return;
    }
    loadSummary(nextYear);
  };

  const resolveSortValue = (item, columnKey) => {
    switch (columnKey) {
      case 'date': {
        const timestamp = Date.parse(item.date);
        return Number.isNaN(timestamp) ? null : timestamp;
      }
      case 'amount': {
        const value = Number(item.amount);
        return Number.isFinite(value) ? value : null;
      }
      case 'installments': {
        if (!item.installments || typeof item.installments !== 'object') {
          return null;
        }
        const current = Number(item.installments.current);
        const total = Number(item.installments.total);
        if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) {
          return null;
        }
        return total * 1000 + current;
      }
      case 'place':
      case 'category':
      case 'owner': {
        const rawValue =
          typeof item[columnKey] === 'string' ? item[columnKey].trim() : '';
        if (!rawValue) {
          return null;
        }
        return rawValue.toLocaleLowerCase();
      }
      default:
        return null;
    }
  };

  const sortedTransactions = useMemo(() => {
    if (!sortColumn) {
      return transactions;
    }

    const next = [...transactions];

    next.sort((a, b) => {
      const valueA = resolveSortValue(a, sortColumn);
      const valueB = resolveSortValue(b, sortColumn);
      const isEmptyA = valueA === null || typeof valueA === 'undefined';
      const isEmptyB = valueB === null || typeof valueB === 'undefined';

      if (isEmptyA && isEmptyB) {
        return 0;
      }
      if (isEmptyA) {
        return 1;
      }
      if (isEmptyB) {
        return -1;
      }

      if (valueA < valueB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return next;
  }, [transactions, sortColumn, sortDirection]);

  const handleSort = (columnKey) => {
    setState((prev) => {
      if (prev.sortColumn === columnKey) {
        const nextDirection = prev.sortDirection === 'asc' ? 'desc' : 'asc';
        return {
          ...prev,
          sortDirection: nextDirection
        };
      }

      return {
        ...prev,
        sortColumn: columnKey,
        sortDirection: 'asc'
      };
    });
  };

  const getSortButtonLabel = (columnKey, label) => {
    if (sortColumn === columnKey) {
      const directionLabel = sortDirection === 'asc' ? 'ascending' : 'descending';
      return `Sort by ${label}, currently ${directionLabel}`;
    }
    return `Sort by ${label}`;
  };

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

  const renderPagination = () => {
    if (!hasYears) {
      return null;
    }

    return (
      <nav style={styles.pagination} aria-label="Years">
        {years.map((yearOption) => {
          const isActive = yearOption === selectedYear;
          return (
            <button
              key={yearOption}
              type="button"
              onClick={() => handleYearClick(yearOption)}
              style={{
                ...styles.yearButton,
                ...(isActive ? styles.yearButtonActive : null)
              }}
              disabled={isLoading}
            >
              {yearOption}
            </button>
          );
        })}
      </nav>
    );
  };

  const renderTransactionsSection = () => {
    if (!selectedMonth && !isTransactionsLoading) {
      return null;
    }

    const label = selectedMonthLabel || selectedMonth || '';
    const showTable = !isTransactionsLoading && !transactionsError && hasTransactions;

    return (
      <div style={styles.transactionsSection}>
        <div style={styles.transactionsHeader}>
          <h2 style={styles.transactionsTitle}>
            Transactions
            {label ? ` • ${label}` : ''}
          </h2>
        </div>
        {isTransactionsLoading && <p style={styles.loadingMessage}>Loading transactions...</p>}
        {transactionsError && !isTransactionsLoading && (
          <p style={styles.error}>{transactionsError}</p>
        )}
        {!transactionsError && !isTransactionsLoading && !hasTransactions && (
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
                  <th
                    style={styles.tableHeader}
                    aria-sort={
                      sortColumn === 'date'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('date')}
                      aria-label={getSortButtonLabel('date', 'Date')}
                      style={{
                        ...styles.headerButton,
                        ...(sortColumn === 'date' ? styles.headerButtonActive : null)
                      }}
                    >
                      <span>Date</span>
                      {renderSortIndicator('date')}
                    </button>
                  </th>
                  <th
                    style={styles.tableHeader}
                    aria-sort={
                      sortColumn === 'place'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('place')}
                      aria-label={getSortButtonLabel('place', 'Place')}
                      style={{
                        ...styles.headerButton,
                        ...(sortColumn === 'place' ? styles.headerButtonActive : null)
                      }}
                    >
                      <span>Place</span>
                      {renderSortIndicator('place')}
                    </button>
                  </th>
                  <th
                    style={styles.tableHeader}
                    aria-sort={
                      sortColumn === 'category'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('category')}
                      aria-label={getSortButtonLabel('category', 'Category')}
                      style={{
                        ...styles.headerButton,
                        ...(sortColumn === 'category' ? styles.headerButtonActive : null)
                      }}
                    >
                      <span>Category</span>
                      {renderSortIndicator('category')}
                    </button>
                  </th>
                  <th
                    style={styles.tableHeader}
                    aria-sort={
                      sortColumn === 'owner'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('owner')}
                      aria-label={getSortButtonLabel('owner', 'Owner')}
                      style={{
                        ...styles.headerButton,
                        ...(sortColumn === 'owner' ? styles.headerButtonActive : null)
                      }}
                    >
                      <span>Owner</span>
                      {renderSortIndicator('owner')}
                    </button>
                  </th>
                  <th
                    style={styles.tableHeader}
                    aria-sort={
                      sortColumn === 'installments'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('installments')}
                      aria-label={getSortButtonLabel('installments', 'Installments')}
                      style={{
                        ...styles.headerButton,
                        ...(sortColumn === 'installments' ? styles.headerButtonActive : null)
                      }}
                    >
                      <span>Installments</span>
                      {renderSortIndicator('installments')}
                    </button>
                  </th>
                  <th
                    style={{ ...styles.tableHeader, ...styles.tableHeaderNumeric }}
                    aria-sort={
                      sortColumn === 'amount'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('amount')}
                      aria-label={getSortButtonLabel('amount', 'Amount')}
                      style={{
                        ...styles.headerButton,
                        ...styles.headerButtonNumeric,
                        ...(sortColumn === 'amount' ? styles.headerButtonActive : null)
                      }}
                    >
                      <span>Amount</span>
                      {renderSortIndicator('amount')}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.map((transaction, index) => (
                  <tr
                    key={transaction.id || `${transaction.date}-${index}`}
                    style={{
                      ...styles.tableRow,
                      ...(index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd)
                    }}
                  >
                    <td style={styles.tableCell}>{formatTransactionDate(transaction.date)}</td>
                    <td style={styles.tableCell}>{transaction.place || 'N/A'}</td>
                    <td style={styles.tableCell}>{transaction.category || 'N/A'}</td>
                    <td style={styles.tableCell}>{transaction.owner || 'N/A'}</td>
                    <td style={styles.tableCell}>
                      {formatInstallments(transaction.installments)}
                    </td>
                    <td style={{ ...styles.tableCell, ...styles.tableCellNumeric }}>
                      {currencyFormatter.format(Number(transaction.amount || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <section style={styles.wrapper}>
      {renderPagination()}
      {error && <p style={styles.error}>{error}</p>}
      {!error && !hasYears && !isLoading && (
        <p style={styles.emptyMessage}>
          No statement years found yet. Upload CSV files to populate this chart.
        </p>
      )}
      {!error && hasYears && !hasData && !isLoading && (
        <p style={styles.emptyMessage}>
          No statements found for {selectedYear}. Upload CSV files to populate this chart.
        </p>
      )}
      <div style={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
            <XAxis
              dataKey="displayMonth"
              stroke="#e2e8f0"
              style={{ fontSize: '0.85rem' }}
              tickLine={false}
            />
            <YAxis
              stroke="#e2e8f0"
              style={{ fontSize: '0.85rem' }}
              tickLine={false}
              width={80}
              tickFormatter={(value) => currencyFormatter.format(Number(value))}
            />
            <Tooltip
              cursor={{ fill: 'rgba(148, 163, 184, 0.15)' }}
              formatter={(value) => [currencyFormatter.format(Number(value)), 'Total']}
              labelFormatter={(label, payload) => {
                if (payload && payload.length) {
                  const { displayMonth, month } = payload[0].payload;
                  if (displayMonth && selectedYear) {
                    return `${displayMonth} ${selectedYear}`;
                  }
                  if (displayMonth) {
                    return displayMonth;
                  }
                  if (month) {
                    return month;
                  }
                }
                return `Month: ${label}`;
              }}
              contentStyle={styles.tooltip}
            />
            <Bar
              dataKey="totalAmount"
              fill="#38bdf8"
              radius={[6, 6, 0, 0]}
              onClick={handleBarClick}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {renderTransactionsSection()}
    </section>
  );
}

const styles = {
  wrapper: {
    width: 'min(960px, 100%)',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    textAlign: 'left'
  },
  pagination: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem'
  },
  yearButton: {
    padding: '0.5rem 1.1rem',
    borderRadius: '9999px',
    border: '1px solid rgba(148, 163, 184, 0.35)',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    color: '#e2e8f0',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'background-color 0.2s ease, transform 0.2s ease'
  },
  yearButtonActive: {
    backgroundColor: '#38bdf8',
    color: '#0f172a',
    transform: 'translateY(-2px)'
  },
  error: {
    margin: 0,
    color: '#f87171'
  },
  emptyMessage: {
    margin: 0,
    color: '#cbd5f5'
  },
  chartContainer: {
    width: '100%',
    backgroundColor: 'rgba(2, 6, 23, 0.65)',
    borderRadius: '1rem',
    padding: '1.5rem'
  },
  transactionsSection: {
    width: '100%',
    backgroundColor: 'rgba(2, 6, 23, 0.65)',
    borderRadius: '1rem',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  transactionsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem'
  },
  transactionsTitle: {
    margin: 0,
    fontSize: '1.25rem'
  },
  loadingMessage: {
    margin: 0,
    color: '#94a3b8'
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
    textAlign: 'left',
    padding: '0.75rem 1rem',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
    color: '#94a3b8'
  },
  tableHeaderNumeric: {
    textAlign: 'right'
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
  tableCellNumeric: {
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums'
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
  headerButtonNumeric: {
    justifyContent: 'flex-end',
    width: '100%'
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
  },
  tooltip: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    border: '1px solid rgba(148, 163, 184, 0.3)',
    borderRadius: '0.75rem',
    color: '#f8fafc'
  }
};
