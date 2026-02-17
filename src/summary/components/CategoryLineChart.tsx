import React, { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { currencyFormatter } from '../utils/formatters';
import {
  CategoryLine,
  MonthlyCategorySummaryEntry
} from '../../models/monthly-category-summary';

interface CategoryLineChartProps {
  data: MonthlyCategorySummaryEntry[];
  categories: CategoryLine[];
}

const palette = [
  '#38bdf8',
  '#f97316',
  '#22c55e',
  '#f43f5e',
  '#eab308',
  '#14b8a6',
  '#a78bfa',
  '#fb7185',
  '#06b6d4',
  '#84cc16',
  '#f59e0b',
  '#ef4444'
];

const styles: Record<string, React.CSSProperties> = {
  chartContainer: {
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: 'rgba(2, 6, 23, 0.65)',
    borderRadius: '1rem',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    alignSelf: 'center'
  },
  tooltip: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    border: '1px solid rgba(148, 163, 184, 0.3)',
    borderRadius: '0.75rem',
    color: '#f8fafc'
  },
  legendContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    alignItems: 'center'
  },
  legendButton: {
    border: '1px solid rgba(148, 163, 184, 0.4)',
    borderRadius: '9999px',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    color: '#e2e8f0',
    padding: '0.3rem 0.75rem',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600
  },
  legendButtonInactive: {
    opacity: 0.5
  },
  legendDot: {
    display: 'inline-block',
    width: '0.55rem',
    height: '0.55rem',
    borderRadius: '9999px',
    marginRight: '0.4rem'
  }
};

export default function CategoryLineChart({ data, categories }: CategoryLineChartProps) {
  const [visibleCategoryCodes, setVisibleCategoryCodes] = useState<string[]>([]);

  const nameByCategory = useMemo(() => {
    const next: Record<string, string> = {};
    categories.forEach((line) => {
      next[line.category] = line.name;
    });
    return next;
  }, [categories]);

  const chartData = useMemo(() => {
    return data.map((entry) => {
      const point: Record<string, number | string> = {
        month: entry.month,
        displayMonth: entry.displayMonth || entry.monthName || entry.month
      };
      categories.forEach((line) => {
        point[line.category] = entry.totalsByCategory[line.category] ?? 0;
      });
      return point;
    });
  }, [categories, data]);

  useEffect(() => {
    setVisibleCategoryCodes(categories.map((line) => line.category));
  }, [categories]);

  const visibleSet = useMemo(() => new Set(visibleCategoryCodes), [visibleCategoryCodes]);

  if (!categories.length) {
    return null;
  }

  return (
    <div style={styles.chartContainer}>
      <ResponsiveContainer width="100%" height={430}>
        <LineChart data={chartData}>
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
            width={90}
            tickFormatter={(value) => currencyFormatter.format(Number(value))}
          />
          <Tooltip
            formatter={(value, name) => {
              const numericValue = Number(value);
              const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
              const categoryKey = typeof name === 'string' ? name : String(name);
              const displayName = nameByCategory[categoryKey] || categoryKey;
              return [currencyFormatter.format(safeValue), displayName];
            }}
            itemSorter={(item: any) => {
              const numericValue = Number(item?.value);
              return Number.isFinite(numericValue) ? -numericValue : 0;
            }}
            contentStyle={styles.tooltip}
          />
          <Legend
            content={(legendProps: any) => {
              const payload = Array.isArray(legendProps?.payload) ? legendProps.payload : [];
              if (!payload.length) {
                return null;
              }

              return (
                <div style={styles.legendContainer}>
                  {payload.map((item: any) => {
                    const categoryCode =
                      typeof item?.value === 'string' ? item.value : String(item?.value ?? '');
                    if (!categoryCode) {
                      return null;
                    }
                    const isVisible = visibleSet.has(categoryCode);
                    const displayName = nameByCategory[categoryCode] || categoryCode;
                    const color =
                      typeof item?.color === 'string' && item.color ? item.color : '#94a3b8';

                    return (
                      <button
                        key={categoryCode}
                        type="button"
                        style={{
                          ...styles.legendButton,
                          ...(isVisible ? null : styles.legendButtonInactive)
                        }}
                        onClick={() => {
                          setVisibleCategoryCodes((prev) => {
                            const prevSet = new Set(prev);
                            if (prevSet.has(categoryCode)) {
                              if (prevSet.size === 1) {
                                return prev;
                              }
                              prevSet.delete(categoryCode);
                              return categories
                                .map((line) => line.category)
                                .filter((code) => prevSet.has(code));
                            }
                            prevSet.add(categoryCode);
                            return categories
                              .map((line) => line.category)
                              .filter((code) => prevSet.has(code));
                          });
                        }}
                      >
                        <span style={{ ...styles.legendDot, backgroundColor: color }} />
                        {displayName}
                      </button>
                    );
                  })}
                </div>
              );
            }}
          />
          {categories.map((line, index) => (
            <Line
              key={line.category}
              type="linear"
              dataKey={line.category}
              name={line.category}
              stroke={palette[index % palette.length]}
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 5 }}
              hide={!visibleSet.has(line.category)}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
