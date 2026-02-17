import React, { useMemo } from 'react';
import {
  CategoryLine,
  MonthlyCategorySummaryEntry
} from '../../models/monthly-category-summary';
import { currencyFormatter } from '../utils/formatters';

interface CategoryYearlyTableProps {
  data: MonthlyCategorySummaryEntry[];
  categories: CategoryLine[];
  selectedYear: string;
}

interface CategoryYearlyRow {
  category: string;
  name: string;
  total: number;
  percentageInYear: number;
  monthlyAverage: number;
}

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    alignSelf: 'center',
    marginTop: '1.5rem'
  },
  tableWrapper: {
   width: '100%',
    borderRadius: '0.75rem',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    overflowX: 'hidden'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'center'
  },
  tableHeader: {
    padding: '0.75rem 1rem',
    fontSize: '0.8rem',
    letterSpacing: '0.05em',
    borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
    color: '#94a3b8',
    textAlign: 'center'
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
  categoryCell: {
    fontWeight: 600,
    color: '#f8fafc'
  },
  numericCell: {
    fontVariantNumeric: 'tabular-nums'
  }
};

export default function CategoryYearlyTable({
  data,
  categories,
  selectedYear
}: CategoryYearlyTableProps) {
  const rows = useMemo<CategoryYearlyRow[]>(() => {
    const totalsByCategory = new Map<string, number>();

    categories.forEach((line) => {
      totalsByCategory.set(line.category, 0);
    });

    data.forEach((entry) => {
      categories.forEach((line) => {
        const value = entry.totalsByCategory[line.category] ?? 0;
        totalsByCategory.set(line.category, (totalsByCategory.get(line.category) ?? 0) + value);
      });
    });

    const yearTotal = Array.from(totalsByCategory.values()).reduce((acc, value) => acc + value, 0);

    return categories
      .map((line) => {
        const total = totalsByCategory.get(line.category) ?? 0;
        const percentageInYear = yearTotal > 0 ? (total / yearTotal) * 100 : 0;
        const monthlyAverage = total / 12;
        return {
          category: line.category,
          name: line.name,
          total: Number.parseFloat(total.toFixed(2)),
          percentageInYear: Number.parseFloat(percentageInYear.toFixed(2)),
          monthlyAverage: Number.parseFloat(monthlyAverage.toFixed(2))
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [categories, data]);

  if (!categories.length) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th scope="col" style={styles.tableHeader}>
                Categoria
              </th>
              <th scope="col" style={{ ...styles.tableHeader, ...styles.tableHeaderNumeric }}>
                Total
              </th>
              <th scope="col" style={{ ...styles.tableHeader, ...styles.tableHeaderNumeric }}>
                % no ano
              </th>
              <th scope="col" style={{ ...styles.tableHeader, ...styles.tableHeaderNumeric }}>
                Média mensal
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.category}
                style={index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}
              >
                <td style={{ ...styles.tableCell, ...styles.categoryCell }}>{row.name}</td>
                <td style={{ ...styles.tableCell, ...styles.numericCell }}>
                  {currencyFormatter.format(row.total)}
                </td>
                <td style={{ ...styles.tableCell, ...styles.numericCell }}>
                  {percentFormatter.format(row.percentageInYear)}%
                </td>
                <td style={{ ...styles.tableCell, ...styles.numericCell }}>
                  {currencyFormatter.format(row.monthlyAverage)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
