import React from 'react';
import SummaryChart from './components/SummaryChart';
import TransactionsSection from './components/TransactionsSection';
import YearPagination from './components/YearPagination';
import { useMonthlySummary } from './hooks/useMonthlySummary';
import CategorySummary from './components/CategorySummary';

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
  },
  sectionDivider: {
    width: 'min(900px, 100%)',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '0.75rem'
  },
  sectionDividerLine: {
    flex: 1,
    border: 0,
    borderTop: '1px solid rgba(148, 163, 184, 0.35)'
  },
  sectionDividerTitle: {
    margin: 0,
    color: '#cbd5f5',
    fontSize: '1.5rem',
    fontWeight: 600,
    whiteSpace: 'nowrap'
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
      <div style={styles.sectionDivider}>
        <hr style={styles.sectionDividerLine} />
        <p style={styles.sectionDividerTitle}>Resumo</p>
        <hr style={styles.sectionDividerLine} />
      </div>
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
      <div style={styles.sectionDivider}>
        <hr style={styles.sectionDividerLine} />
        <p style={styles.sectionDividerTitle}>Por categoria</p>
        <hr style={styles.sectionDividerLine} />
      </div>
      <CategorySummary selectedYear={selectedYear} />
    </section>
  );
}
