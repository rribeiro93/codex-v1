import React from 'react';
import SummaryChart from './components/SummaryChart';
import TransactionsSection from './components/TransactionsSection';
import YearPagination from './components/YearPagination';
import { useMonthlySummary } from './hooks/useMonthlySummary';

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    textAlign: 'left',
    alignItems: 'center'
  },
  section: {
    width: 'min(1200px, 100%)'
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

export default function Summary() {
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
    handleTransactionMappingChange,
    yearlyAverage,
    transactionsTotalAmount,
    installmentStats
  } = useMonthlySummary();

  const transactionsLabel = selectedMonthLabel || selectedMonth || '';

  return (
    <section style={styles.wrapper}>
      <div style={styles.section}>
        <YearPagination
          years={years}
          selectedYear={selectedYear}
          isLoading={isLoading}
          onSelect={handleYearClick}
        />
      </div>
      {error && (
        <div style={styles.section}>
          <p style={styles.error}>{error}</p>
        </div>
      )}
      {!error && !hasYears && !isLoading && (
        <div style={styles.section}>
          <p style={styles.emptyMessage}>
            Ainda não há anos de extrato disponíveis. Importe arquivos CSV para popular este gráfico.
          </p>
        </div>
      )}
      {!error && hasYears && !hasData && !isLoading && (
        <div style={styles.section}>
          <p style={styles.emptyMessage}>
            Não encontramos extratos para {selectedYear}. Importe arquivos CSV para popular este gráfico.
          </p>
        </div>
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
        onTransactionMappingChange={handleTransactionMappingChange}
        totalAmount={transactionsTotalAmount}
        installmentStats={installmentStats}
      />
    </section>
  );
}
