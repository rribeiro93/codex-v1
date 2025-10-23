import React from 'react';
import SummaryChart from './components/SummaryChart';
import TransactionsSection from './components/TransactionsSection';
import YearPagination from './components/YearPagination';
import { useMonthlySummary } from './hooks/useMonthlySummary';

const styles = {
  wrapper: {
    width: 'min(960px, 100%)',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    textAlign: 'left'
  },
  error: {
    margin: 0,
    color: '#f87171'
  },
  emptyMessage: {
    margin: 0,
    color: '#cbd5f5'
  }
};

export default function MonthlySummary() {
  const {
    data,
    years,
    selectedYear,
    selectedMonth,
    selectedMonthLabel,
    isLoading,
    isTransactionsLoading,
    error,
    transactionsError,
    hasData,
    hasYears,
    hasTransactions,
    handleYearClick,
    handleBarClick,
    sortedTransactions,
    sortColumn,
    sortDirection,
    handleSort,
    yearlyAverage
  } = useMonthlySummary();

  const transactionsLabel = selectedMonthLabel || selectedMonth || '';

  return (
    <section style={styles.wrapper}>
      <YearPagination
        years={years}
        selectedYear={selectedYear}
        isLoading={isLoading}
        onSelect={handleYearClick}
      />
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
      <SummaryChart
        data={data}
        selectedYear={selectedYear}
        onBarClick={handleBarClick}
        averageAmount={yearlyAverage}
      />
      <TransactionsSection
        selectedMonth={selectedMonth}
        label={transactionsLabel}
        isLoading={isTransactionsLoading}
        error={transactionsError}
        transactions={sortedTransactions}
        hasTransactions={hasTransactions}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
      />
    </section>
  );
}
