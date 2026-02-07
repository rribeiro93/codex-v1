"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Summary;
const jsx_runtime_1 = require("react/jsx-runtime");
const SummaryChart_1 = __importDefault(require("./components/SummaryChart"));
const TransactionsSection_1 = __importDefault(require("./components/TransactionsSection"));
const YearPagination_1 = __importDefault(require("./components/YearPagination"));
const useMonthlySummary_1 = require("./hooks/useMonthlySummary");
const styles = {
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
function Summary() {
    const { data, years, selectedYear, selectedMonth, selectedMonthLabel, isLoading, isTransactionsLoading, error, transactionsError, hasData, hasYears, hasTransactions, handleYearClick, handleBarClick, sortedTransactions, sortColumn, sortDirection, handleSort, handleTransactionMappingChange, yearlyAverage, transactionsTotalAmount, installmentStats } = (0, useMonthlySummary_1.useMonthlySummary)();
    const transactionsLabel = selectedMonthLabel || selectedMonth || '';
    return ((0, jsx_runtime_1.jsxs)("section", { style: styles.wrapper, children: [(0, jsx_runtime_1.jsx)("div", { style: styles.section, children: (0, jsx_runtime_1.jsx)(YearPagination_1.default, { years: years, selectedYear: selectedYear, isLoading: isLoading, onSelect: handleYearClick }) }), error && ((0, jsx_runtime_1.jsx)("div", { style: styles.section, children: (0, jsx_runtime_1.jsx)("p", { style: styles.error, children: error }) })), !error && !hasYears && !isLoading && ((0, jsx_runtime_1.jsx)("div", { style: styles.section, children: (0, jsx_runtime_1.jsx)("p", { style: styles.emptyMessage, children: "Ainda n\u00E3o h\u00E1 anos de extrato dispon\u00EDveis. Importe arquivos CSV para popular este gr\u00E1fico." }) })), !error && hasYears && !hasData && !isLoading && ((0, jsx_runtime_1.jsx)("div", { style: styles.section, children: (0, jsx_runtime_1.jsxs)("p", { style: styles.emptyMessage, children: ["N\u00E3o encontramos extratos para ", selectedYear, ". Importe arquivos CSV para popular este gr\u00E1fico."] }) })), (0, jsx_runtime_1.jsx)(SummaryChart_1.default, { data: data, selectedYear: selectedYear, onBarClick: handleBarClick, averageAmount: yearlyAverage }), (0, jsx_runtime_1.jsx)(TransactionsSection_1.default, { selectedMonth: selectedMonth, label: transactionsLabel, isLoading: isTransactionsLoading, error: transactionsError, transactions: sortedTransactions, hasTransactions: hasTransactions, sortColumn: sortColumn, sortDirection: sortDirection, onSort: handleSort, onTransactionMappingChange: handleTransactionMappingChange, totalAmount: transactionsTotalAmount, installmentStats: installmentStats })] }));
}
