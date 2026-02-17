import React from 'react';
import CategoryLineChart from './CategoryLineChart';
import CategoryYearlyTable from './CategoryYearlyTable';
import { useMonthlyCategorySummary } from '../hooks/useMonthlyCategorySummary';

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

interface CategorySummaryProps {
  selectedYear?: string;
}

export default function CategorySummary({ selectedYear: requestedYear }: CategorySummaryProps) {
  const {
    data,
    categories,
    years,
    selectedYear,
    isLoading,
    error,
    hasYears,
    hasData,
    hasCategories,
    handleYearClick
  } = useMonthlyCategorySummary(requestedYear);

  return (
    <section style={styles.wrapper}>
      {error && (
        <div style={styles.section}>
          <p style={styles.error}>{error}</p>
        </div>
      )}
      {!error && !hasYears && !isLoading && (
        <div style={styles.section}>
          <p style={styles.emptyMessage}>
            Ainda não há anos de extrato disponíveis. Importe arquivos CSV para gerar o gráfico.
          </p>
        </div>
      )}
      {!error && hasYears && !hasCategories && !isLoading && (
        <div style={styles.section}>
          <p style={styles.emptyMessage}>
            Não há categorias cadastradas. Cadastre categorias para visualizar as linhas no gráfico.
          </p>
        </div>
      )}
      {!error && hasYears && hasCategories && !hasData && !isLoading && (
        <div style={styles.section}>
          <p style={styles.emptyMessage}>
            Não encontramos dados para {selectedYear}. Importe arquivos CSV para popular este gráfico.
          </p>
        </div>
      )}
      {!error && hasYears && hasCategories && (
        <>
          <CategoryLineChart data={data} categories={categories} />
          <CategoryYearlyTable
            data={data}
            categories={categories}
            selectedYear={selectedYear}
          />
        </>
      )}
    </section>
  );
}
