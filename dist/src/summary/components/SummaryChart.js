"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SummaryChart;
const jsx_runtime_1 = require("react/jsx-runtime");
const recharts_1 = require("recharts");
const formatters_1 = require("../utils/formatters");
const styles = {
    chartContainer: {
        width: 'min(900px, 100%)',
        backgroundColor: 'rgba(2, 6, 23, 0.65)',
        borderRadius: '1rem',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        alignSelf: 'center'
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
function SummaryChart({ data, selectedYear, onBarClick, averageAmount = 0 }) {
    const formattedAverage = formatters_1.currencyFormatter.format(Number.isFinite(averageAmount) ? averageAmount : 0);
    const tooltipLabels = {
        installmentAmount: 'Parcelado',
        nonInstallmentAmount: 'A vista'
    };
    return ((0, jsx_runtime_1.jsxs)("div", { style: styles.chartContainer, children: [(0, jsx_runtime_1.jsx)("div", { style: styles.chartHeader, children: (0, jsx_runtime_1.jsxs)("p", { style: styles.averageLabel, children: ["M\u00E9dia: ", formattedAverage] }) }), (0, jsx_runtime_1.jsx)(recharts_1.ResponsiveContainer, { width: "100%", height: 400, children: (0, jsx_runtime_1.jsxs)(recharts_1.BarChart, { data: data, children: [(0, jsx_runtime_1.jsx)(recharts_1.CartesianGrid, { strokeDasharray: "3 3", stroke: "rgba(148, 163, 184, 0.3)" }), (0, jsx_runtime_1.jsx)(recharts_1.XAxis, { dataKey: "displayMonth", stroke: "#e2e8f0", style: { fontSize: '0.85rem' }, tickLine: false }), (0, jsx_runtime_1.jsx)(recharts_1.YAxis, { stroke: "#e2e8f0", style: { fontSize: '0.85rem' }, tickLine: false, width: 80, tickFormatter: (value) => formatters_1.currencyFormatter.format(Number(value)) }), (0, jsx_runtime_1.jsx)(recharts_1.Tooltip, { cursor: { fill: 'rgba(148, 163, 184, 0.15)' }, formatter: (value, name) => {
                                const numericValue = Number(value);
                                const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
                                return [formatters_1.currencyFormatter.format(safeValue), tooltipLabels[name] ?? 'Total'];
                            }, labelFormatter: (label, payload) => {
                                if (payload && payload.length) {
                                    const { displayMonth, month } = payload[0].payload;
                                    const total = payload[0]?.payload?.totalAmount;
                                    const totalLabel = typeof total === 'number' && Number.isFinite(total)
                                        ? ` • Total ${formatters_1.currencyFormatter.format(total)}`
                                        : '';
                                    if (displayMonth && selectedYear) {
                                        return `${displayMonth} ${totalLabel}`;
                                    }
                                    if (displayMonth) {
                                        return `${displayMonth}${totalLabel}`;
                                    }
                                    if (month) {
                                        return `${month}${totalLabel}`;
                                    }
                                }
                                return `Mês: ${label}`;
                            }, contentStyle: styles.tooltip }), (0, jsx_runtime_1.jsx)(recharts_1.Legend, { wrapperStyle: { color: '#cbd5f5' }, formatter: (value) => tooltipLabels[value] ?? value }), (0, jsx_runtime_1.jsx)(recharts_1.Bar, { dataKey: "nonInstallmentAmount", stackId: "monthlyTotals", fill: "#38bdf8", radius: [0, 0, 0, 0], onClick: (payload, index) => onBarClick(payload, index) }), (0, jsx_runtime_1.jsx)(recharts_1.Bar, { dataKey: "installmentAmount", stackId: "monthlyTotals", fill: "#f97316", radius: [6, 6, 0, 0], onClick: (payload, index) => onBarClick(payload, index) })] }) })] }));
}
