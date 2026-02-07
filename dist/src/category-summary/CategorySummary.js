"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CategorySummary;
const jsx_runtime_1 = require("react/jsx-runtime");
const CategoryLineChart_1 = __importDefault(require("./components/CategoryLineChart"));
const useMonthlyCategorySummary_1 = require("./hooks/useMonthlyCategorySummary");
const YearPagination_1 = __importDefault(require("../summary/components/YearPagination"));
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
function CategorySummary() {
    const { data, categories, years, selectedYear, isLoading, error, hasYears, hasData, hasCategories, handleYearClick } = (0, useMonthlyCategorySummary_1.useMonthlyCategorySummary)();
    return ((0, jsx_runtime_1.jsxs)("section", { style: styles.wrapper, children: [(0, jsx_runtime_1.jsx)("div", { style: styles.section, children: (0, jsx_runtime_1.jsx)(YearPagination_1.default, { years: years, selectedYear: selectedYear, isLoading: isLoading, onSelect: handleYearClick }) }), error && ((0, jsx_runtime_1.jsx)("div", { style: styles.section, children: (0, jsx_runtime_1.jsx)("p", { style: styles.error, children: error }) })), !error && !hasYears && !isLoading && ((0, jsx_runtime_1.jsx)("div", { style: styles.section, children: (0, jsx_runtime_1.jsx)("p", { style: styles.emptyMessage, children: "Ainda n\u00E3o h\u00E1 anos de extrato dispon\u00EDveis. Importe arquivos CSV para gerar o gr\u00E1fico." }) })), !error && hasYears && !hasCategories && !isLoading && ((0, jsx_runtime_1.jsx)("div", { style: styles.section, children: (0, jsx_runtime_1.jsx)("p", { style: styles.emptyMessage, children: "N\u00E3o h\u00E1 categorias cadastradas. Cadastre categorias para visualizar as linhas no gr\u00E1fico." }) })), !error && hasYears && hasCategories && !hasData && !isLoading && ((0, jsx_runtime_1.jsx)("div", { style: styles.section, children: (0, jsx_runtime_1.jsxs)("p", { style: styles.emptyMessage, children: ["N\u00E3o encontramos dados para ", selectedYear, ". Importe arquivos CSV para popular este gr\u00E1fico."] }) })), !error && hasYears && hasCategories && ((0, jsx_runtime_1.jsx)(CategoryLineChart_1.default, { data: data, categories: categories }))] }));
}
