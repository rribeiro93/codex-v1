"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = YearPagination;
const jsx_runtime_1 = require("react/jsx-runtime");
const styles = {
    pagination: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        justifyContent: 'center'
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
    }
};
function YearPagination({ years, selectedYear, isLoading, onSelect }) {
    if (!years.length) {
        return null;
    }
    const orderedYears = [...years].sort((a, b) => a.localeCompare(b));
    return ((0, jsx_runtime_1.jsx)("nav", { style: styles.pagination, "aria-label": "Anos", children: orderedYears.map((yearOption) => {
            const isActive = yearOption === selectedYear;
            return ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => onSelect(yearOption), style: {
                    ...styles.yearButton,
                    ...(isActive ? styles.yearButtonActive : null)
                }, disabled: isLoading, children: yearOption }, yearOption));
        }) }));
}
