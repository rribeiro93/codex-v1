"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CategoryLineChart;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const recharts_1 = require("recharts");
const formatters_1 = require("../../summary/utils/formatters");
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
const styles = {
    chartContainer: {
        width: 'min(1100px, 100%)',
        backgroundColor: 'rgba(2, 6, 23, 0.65)',
        borderRadius: '1rem',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        alignSelf: 'center'
    },
    chartTitle: {
        margin: 0,
        color: '#cbd5f5',
        fontSize: '1rem',
        fontWeight: 600
    },
    tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        border: '1px solid rgba(148, 163, 184, 0.3)',
        borderRadius: '0.75rem',
        color: '#f8fafc'
    }
};
function CategoryLineChart({ data, categories }) {
    const nameByCategory = (0, react_1.useMemo)(() => {
        const next = {};
        categories.forEach((line) => {
            next[line.category] = line.name;
        });
        return next;
    }, [categories]);
    const chartData = (0, react_1.useMemo)(() => {
        return data.map((entry) => {
            const point = {
                month: entry.month,
                displayMonth: entry.displayMonth || entry.monthName || entry.month
            };
            categories.forEach((line) => {
                point[line.category] = entry.totalsByCategory[line.category] ?? 0;
            });
            return point;
        });
    }, [categories, data]);
    if (!categories.length) {
        return null;
    }
    return ((0, jsx_runtime_1.jsxs)("div", { style: styles.chartContainer, children: [(0, jsx_runtime_1.jsx)("p", { style: styles.chartTitle, children: "Total por categoria em cada m\u00EAs" }), (0, jsx_runtime_1.jsx)(recharts_1.ResponsiveContainer, { width: "100%", height: 430, children: (0, jsx_runtime_1.jsxs)(recharts_1.LineChart, { data: chartData, children: [(0, jsx_runtime_1.jsx)(recharts_1.CartesianGrid, { strokeDasharray: "3 3", stroke: "rgba(148, 163, 184, 0.3)" }), (0, jsx_runtime_1.jsx)(recharts_1.XAxis, { dataKey: "displayMonth", stroke: "#e2e8f0", style: { fontSize: '0.85rem' }, tickLine: false }), (0, jsx_runtime_1.jsx)(recharts_1.YAxis, { stroke: "#e2e8f0", style: { fontSize: '0.85rem' }, tickLine: false, width: 90, tickFormatter: (value) => formatters_1.currencyFormatter.format(Number(value)) }), (0, jsx_runtime_1.jsx)(recharts_1.Tooltip, { formatter: (value, name) => {
                                const numericValue = Number(value);
                                const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
                                const displayName = nameByCategory[name] || name;
                                return [formatters_1.currencyFormatter.format(safeValue), displayName];
                            }, contentStyle: styles.tooltip }), (0, jsx_runtime_1.jsx)(recharts_1.Legend, { wrapperStyle: { color: '#cbd5f5' }, formatter: (value) => nameByCategory[value] || value }), categories.map((line, index) => ((0, jsx_runtime_1.jsx)(recharts_1.Line, { type: "monotone", dataKey: line.category, name: line.category, stroke: palette[index % palette.length], strokeWidth: 2, dot: { r: 2 }, activeDot: { r: 5 } }, line.category)))] }) })] }));
}
