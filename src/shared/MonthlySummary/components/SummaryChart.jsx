import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { currencyFormatter } from '../utils/formatters';

const styles = {
  chartContainer: {
    width: '100%',
    backgroundColor: 'rgba(2, 6, 23, 0.65)',
    borderRadius: '1rem',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem'
  },
  averageLabel: {
    margin: 0,
    color: '#cbd5f5',
    fontSize: '1rem',
    fontWeight: 600
  },
  tooltip: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    border: '1px solid rgba(148, 163, 184, 0.3)',
    borderRadius: '0.75rem',
    color: '#f8fafc'
  }
};

export default function SummaryChart({ data, selectedYear, onBarClick, averageAmount = 0 }) {
  const formattedAverage = currencyFormatter.format(Number.isFinite(averageAmount) ? averageAmount : 0);

  return (
    <div style={styles.chartContainer}>
      <div style={styles.chartHeader}>
        <p style={styles.averageLabel}>Average: {formattedAverage}</p>
      </div>
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
          <Bar dataKey="totalAmount" fill="#38bdf8" radius={[6, 6, 0, 0]} onClick={onBarClick} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
