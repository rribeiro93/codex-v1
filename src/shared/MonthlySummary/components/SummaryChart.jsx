import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
  const tooltipLabels = {
    installmentAmount: 'Installments',
    nonInstallmentAmount: 'Non-installment total'
  };

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
            formatter={(value, name) => {
              const numericValue = Number(value);
              const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
              return [currencyFormatter.format(safeValue), tooltipLabels[name] ?? 'Total'];
            }}
            labelFormatter={(label, payload) => {
              if (payload && payload.length) {
                const { displayMonth, month } = payload[0].payload;
                const total = payload[0]?.payload?.totalAmount;
                const totalLabel =
                  typeof total === 'number' && Number.isFinite(total)
                    ? ` • Total ${currencyFormatter.format(total)}`
                    : '';
                if (displayMonth && selectedYear) {
                  return `${displayMonth} ${selectedYear}${totalLabel}`;
                }
                if (displayMonth) {
                  return `${displayMonth}${totalLabel}`;
                }
                if (month) {
                  return `${month}${totalLabel}`;
                }
              }
              return `Month: ${label}`;
            }}
            contentStyle={styles.tooltip}
          />
          <Legend
            wrapperStyle={{ color: '#cbd5f5' }}
            formatter={(value) => tooltipLabels[value] ?? value}
          />
          <Bar
            dataKey="nonInstallmentAmount"
            stackId="monthlyTotals"
            fill="#38bdf8"
            radius={[0, 0, 0, 0]}
            onClick={onBarClick}
          />
          <Bar
            dataKey="installmentAmount"
            stackId="monthlyTotals"
            fill="#f97316"
            radius={[6, 6, 0, 0]}
            onClick={onBarClick}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
