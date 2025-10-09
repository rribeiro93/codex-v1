import React, { useEffect, useState } from 'react';
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

const initialState = {
  data: [],
  years: [],
  selectedYear: '',
  isLoading: false,
  error: ''
};

export default function MonthlySummary() {
  const [state, setState] = useState(initialState);

  const { data, years, selectedYear, isLoading, error } = state;

  const loadSummary = async (year) => {
    if (typeof fetch !== 'function') {
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: '',
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

      setState({
        data: normalized,
        years: responseYears,
        selectedYear: normalizedSelectedYear,
        isLoading: false,
        error: ''
      });
    } catch (err) {
      console.error('Failed to load monthly summary', err);
      setState({
        data: [],
        years: [],
        selectedYear: '',
        isLoading: false,
        error: 'Unable to load monthly totals. Please try again.'
      });
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const hasData = data.length > 0;
  const hasYears = years.length > 0;

  const handleYearClick = (nextYear) => {
    if (!nextYear || nextYear === selectedYear) {
      return;
    }
    loadSummary(nextYear);
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
            <Bar dataKey="totalAmount" fill="#38bdf8" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
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
  tooltip: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    border: '1px solid rgba(148, 163, 184, 0.3)',
    borderRadius: '0.75rem',
    color: '#f8fafc'
  }
};
