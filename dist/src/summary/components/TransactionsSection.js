"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TransactionsSection;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const formatters_1 = require("../utils/formatters");
function isInstallmentTransaction(installments) {
    if (!installments || typeof installments !== 'object') {
        return false;
    }
    const current = Number(installments.current);
    const total = Number(installments.total);
    if (Number.isNaN(total) || total <= 1) {
        return false;
    }
    if (Number.isNaN(current) || current <= 0) {
        return false;
    }
    return true;
}
function formatPercentage(value) {
    if (!Number.isFinite(value)) {
        return '0%';
    }
    return `${value.toFixed(1)}%`;
}
function createCategoryOption(category) {
    if (!category || typeof category !== 'object') {
        return null;
    }
    const id = typeof category.id === 'string'
        ? category.id
        : typeof category._id === 'string'
            ? category._id
            : '';
    const name = typeof category.name === 'string' ? category.name.trim() : '';
    const code = typeof category.category === 'string' ? category.category.trim() : '';
    const label = name || code;
    if (!code) {
        return null;
    }
    return {
        id,
        label: label || 'Sem nome',
        value: code
    };
}
const styles = {
    container: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        alignItems: 'center'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        width: 'min(1200px, 100%)'
    },
    title: {
        margin: 0,
        fontSize: '1.25rem'
    },
    loadingMessage: {
        margin: 0,
        color: '#94a3b8'
    },
    emptyMessage: {
        margin: 0,
        color: '#cbd5f5'
    },
    error: {
        margin: 0,
        color: '#f87171'
    },
    success: {
        margin: 0,
        color: '#4ade80'
    },
    infoMessage: {
        margin: 0,
        color: '#cbd5f5'
    },
    tableWrapper: {
        width: '100%',
        borderRadius: '0.75rem',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        overflowX: 'hidden'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse'
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
        color: '#e2e8f0',
        textAlign: 'center'
    },
    placeCell: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.2rem',
        alignItems: 'center'
    },
    placePrimary: {
        fontWeight: 600,
        color: '#f8fafc'
    },
    placeSecondary: {
        fontSize: '0.8rem',
        color: '#94a3b8'
    },
    headerButton: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.35rem',
        background: 'none',
        border: 'none',
        padding: 0,
        margin: 0,
        color: 'inherit',
        font: 'inherit',
        cursor: 'pointer',
        textTransform: 'inherit'
    },
    headerButtonActive: {
        color: '#38bdf8'
    },
    sortIndicator: {
        fontSize: '0.75rem',
        letterSpacing: '0.05em'
    },
    sortIndicatorHidden: {
        visibility: 'hidden'
    },
    breakdownHeader: {
        marginBottom: '0.75rem',
        textAlign: 'center'
    },
    breakdownTitle: {
        margin: 0,
        fontSize: '1rem',
        color: '#f8fafc'
    },
    breakdownTotal: {
        margin: 0,
        color: '#cbd5f5',
        fontSize: '0.9rem'
    },
    numericCell: {
        textAlign: 'center',
        fontVariantNumeric: 'tabular-nums'
    },
    actionsCell: {
        width: '220px'
    },
    mappingEditor: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem'
    },
    mappingLabel: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        fontSize: '0.85rem',
        color: '#cbd5f5'
    },
    categoryEditorActions: {
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        justifyContent: 'center'
    },
    textInput: {
        padding: '0.4rem 0.6rem',
        borderRadius: '0.5rem',
        border: '1px solid rgba(148, 163, 184, 0.3)',
        backgroundColor: 'rgba(2, 6, 23, 0.6)',
        color: '#f1f5f9',
        fontSize: '0.9rem'
    },
    select: {
        width: '100%',
        padding: '0.4rem 0.6rem',
        borderRadius: '0.5rem',
        border: '1px solid rgba(148, 163, 184, 0.3)',
        backgroundColor: 'rgba(2, 6, 23, 0.6)',
        color: '#f1f5f9',
        fontSize: '0.9rem'
    },
    inlineButton: {
        padding: '0.35rem 0.75rem',
        borderRadius: '9999px',
        border: '1px solid rgba(148, 163, 184, 0.4)',
        backgroundColor: 'rgba(148, 163, 184, 0.1)',
        color: '#e2e8f0',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'background-color 0.2s ease, color 0.2s ease'
    },
    inlineButtonPrimary: {
        padding: '0.35rem 0.9rem',
        borderRadius: '9999px',
        border: '1px solid rgba(56, 189, 248, 0.8)',
        backgroundColor: '#38bdf8',
        color: '#0f172a',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background-color 0.2s ease, color 0.2s ease'
    },
    headerLayer: {
        width: 'min(900px, 100%)',
        backgroundColor: 'rgba(2, 6, 23, 0.65)',
        borderRadius: '1rem',
        padding: '1.5rem',
        border: '1px solid rgba(148, 163, 184, 0.2)'
    },
    breakdownLayer: {
        width: 'min(780px, 100%)',
        alignSelf: 'center'
    },
    transactionsLayer: {
        width: 'min(1200px, 100%)',
        alignSelf: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
    },
    summaryLayer: {
        width: 'min(1200px, 100%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem'
    },
    summaryTitle: {
        margin: 0,
        fontSize: '1.5rem',
        color: '#f8fafc'
    },
    summaryMetrics: {
        display: 'flex',
        gap: '1.5rem',
        alignItems: 'center',
        flexWrap: 'wrap'
    },
    summaryMetric: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        color: '#f1f5f9'
    },
    summaryMetricLabel: {
        fontSize: '0.8rem',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        margin: 0
    },
    summaryMetricValue: {
        margin: 0,
        fontSize: '1.1rem',
        fontWeight: 600
    }
};
const columns = [
    { key: 'date', label: 'Data', isNumeric: false },
    { key: 'place', label: 'Estabelecimento', isNumeric: false },
    { key: 'category', label: 'Categoria', isNumeric: false },
    // { key: 'owner', label: 'Responsável', isNumeric: false },
    { key: 'installments', label: 'Parcelas', isNumeric: false },
    { key: 'amount', label: 'Valor', isNumeric: true }
];
function TransactionsSection({ selectedMonth, label, isLoading, error, transactions, hasTransactions, sortColumn, sortDirection, onSort, onTransactionMappingChange = () => { }, totalAmount = 0, installmentStats = { count: 0, total: 0 } }) {
    const [categoryOptions, setCategoryOptions] = (0, react_1.useState)([]);
    const [categoriesError, setCategoriesError] = (0, react_1.useState)('');
    const [isCategoriesLoading, setIsCategoriesLoading] = (0, react_1.useState)(false);
    const [editingTransactionId, setEditingTransactionId] = (0, react_1.useState)('');
    const [editingCategory, setEditingCategory] = (0, react_1.useState)('');
    const [editingCleanName, setEditingCleanName] = (0, react_1.useState)('');
    const [savingTransactionId, setSavingTransactionId] = (0, react_1.useState)('');
    const [categoryActionError, setCategoryActionError] = (0, react_1.useState)('');
    const [categoryActionMessage, setCategoryActionMessage] = (0, react_1.useState)('');
    const categoryValueToLabel = (0, react_1.useMemo)(() => {
        const map = new Map();
        categoryOptions.forEach((option) => {
            if (option && option.value) {
                map.set(option.value, option.label);
            }
        });
        return map;
    }, [categoryOptions]);
    (0, react_1.useEffect)(() => {
        let isMounted = true;
        const loadCategories = async () => {
            if (typeof fetch !== 'function') {
                setCategoriesError('A edição de categorias não está disponível neste ambiente.');
                return;
            }
            setIsCategoriesLoading(true);
            setCategoriesError('');
            try {
                const response = await fetch('/api/categories');
                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }
                const body = await response.json();
                const received = Array.isArray(body?.categories) ? body.categories : [];
                const formatted = received
                    .map((item) => createCategoryOption(item))
                    .filter((value) => Boolean(value))
                    .sort((a, b) => a.label.localeCompare(b.label, undefined, {
                    sensitivity: 'base'
                }));
                if (isMounted) {
                    setCategoryOptions(formatted);
                }
            }
            catch (categoriesLoadError) {
                console.error('Não foi possível carregar a lista de categorias', categoriesLoadError);
                if (isMounted) {
                    setCategoriesError('Não foi possível carregar a lista de categorias. A seleção ficará limitada.');
                }
            }
            finally {
                if (isMounted) {
                    setIsCategoriesLoading(false);
                }
            }
        };
        loadCategories();
        return () => {
            isMounted = false;
        };
    }, []);
    (0, react_1.useEffect)(() => {
        if (!editingTransactionId) {
            return;
        }
        const stillExists = transactions.some((transaction) => transaction.id === editingTransactionId);
        if (!stillExists) {
            setEditingTransactionId('');
            setEditingCategory('');
            setEditingCleanName('');
        }
    }, [transactions, editingTransactionId]);
    const handleStartMappingEdit = (transaction) => {
        if (!transaction) {
            return;
        }
        setEditingTransactionId(transaction.id);
        setEditingCategory(typeof transaction.category === 'string' ? transaction.category : '');
        const initialCleanName = typeof transaction.cleanName === 'string' && transaction.cleanName.trim()
            ? transaction.cleanName.trim()
            : typeof transaction.place === 'string'
                ? transaction.place.trim()
                : '';
        setEditingCleanName(initialCleanName);
        setCategoryActionError('');
        setCategoryActionMessage('');
    };
    const handleCancelCategoryEdit = () => {
        setEditingTransactionId('');
        setEditingCategory('');
        setEditingCleanName('');
    };
    const handleSaveMapping = async (transaction) => {
        if (!transaction || !transaction.id) {
            return;
        }
        const trimmedCategory = typeof editingCategory === 'string' ? editingCategory.trim() : '';
        const trimmedCleanName = typeof editingCleanName === 'string' ? editingCleanName.trim() : '';
        const payload = {};
        if (typeof editingCategory === 'string') {
            payload.category = trimmedCategory;
        }
        if (typeof editingCleanName === 'string') {
            payload.cleanName = trimmedCleanName;
        }
        if (typeof transaction.mappingId === 'string' && transaction.mappingId) {
            payload.id = transaction.mappingId;
        }
        else {
            const fallbackTransaction = (typeof transaction.mappingTransaction === 'string' && transaction.mappingTransaction.trim()) ||
                (typeof transaction.place === 'string' && transaction.place.trim()) ||
                (typeof transaction.cleanName === 'string' && transaction.cleanName.trim()) ||
                '';
            if (!fallbackTransaction) {
                setCategoryActionError('Não foi possível identificar a transação a ser atualizada.');
                return;
            }
            payload.transaction = fallbackTransaction;
        }
        setSavingTransactionId(transaction.id);
        setCategoryActionError('');
        setCategoryActionMessage('');
        try {
            const response = await fetch('/api/places/categories/single', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }
            const body = await response.json();
            const place = body?.place;
            const updatedCategory = typeof place?.category === 'string' ? place.category : trimmedCategory;
            const updatedCleanName = typeof place?.cleanName === 'string' ? place.cleanName : trimmedCleanName;
            const updatedMappingId = typeof place?.id === 'string' ? place.id : transaction.mappingId;
            const updatedMappingTransaction = typeof place?.transaction === 'string'
                ? place.transaction
                : transaction.mappingTransaction;
            const friendlyName = (typeof updatedCleanName === 'string' && updatedCleanName.trim()) ||
                (typeof transaction.place === 'string' && transaction.place.trim()) ||
                'transação';
            onTransactionMappingChange(transaction.id, {
                category: updatedCategory,
                cleanName: updatedCleanName,
                mappingId: updatedMappingId,
                mappingTransaction: updatedMappingTransaction
            });
            setCategoryActionMessage(`Mapeamento atualizado para ${friendlyName}.`);
            setEditingTransactionId('');
            setEditingCategory('');
            setEditingCleanName('');
        }
        catch (saveError) {
            console.error('Não foi possível atualizar a categoria da transação', saveError);
            setCategoryActionError('Não foi possível atualizar o mapeamento. Tente novamente.');
        }
        finally {
            setSavingTransactionId('');
        }
    };
    const showTable = !isLoading && !error && hasTransactions;
    const categorySummary = (0, react_1.useMemo)(() => {
        if (!Array.isArray(transactions) || !transactions.length) {
            return { totalAmount: 0, items: [] };
        }
        const totalsByCategory = new Map();
        let aggregate = 0;
        for (const transaction of transactions) {
            const amount = Number(transaction.amount);
            const numericAmount = Number.isFinite(amount) ? amount : 0;
            if (numericAmount < 0) {
                continue;
            }
            const categoryValue = typeof transaction.category === 'string' && transaction.category.trim()
                ? transaction.category.trim()
                : 'Não categorizado';
            const label = categoryValue && categoryValueToLabel.has(categoryValue)
                ? categoryValueToLabel.get(categoryValue)
                : '';
            const summaryKey = label || categoryValue;
            aggregate += numericAmount;
            totalsByCategory.set(summaryKey, (totalsByCategory.get(summaryKey) ?? 0) + numericAmount);
        }
        if (!aggregate) {
            return { totalAmount: 0, items: [] };
        }
        const items = Array.from(totalsByCategory.entries())
            .map(([category, amount]) => ({
            category,
            amount: Number.parseFloat(amount.toFixed(2)),
            percentage: Number.parseFloat(((amount / aggregate) * 100).toFixed(2))
        }))
            .sort((a, b) => b.amount - a.amount);
        return {
            totalAmount: Number.parseFloat(aggregate.toFixed(2)),
            items
        };
    }, [transactions, categoryValueToLabel]);
    const showCategorySummary = showTable && categorySummary.items.length > 0;
    const localInstallmentStats = Array.isArray(transactions)
        ? transactions.reduce((acc, transaction) => {
            if (!isInstallmentTransaction(transaction.installments)) {
                return acc;
            }
            const amount = Number(transaction.amount);
            const numericAmount = Number.isFinite(amount) ? amount : 0;
            return {
                count: acc.count + 1,
                total: acc.total + numericAmount
            };
        }, { count: 0, total: 0 })
        : { count: 0, total: 0 };
    const renderSortIndicator = (columnKey) => {
        const isActive = sortColumn === columnKey;
        const symbol = sortDirection === 'asc' ? '^' : 'v';
        return ((0, jsx_runtime_1.jsx)("span", { style: {
                ...styles.sortIndicator,
                ...(isActive ? null : styles.sortIndicatorHidden)
            }, "aria-hidden": "true", children: symbol }));
    };
    if (!selectedMonth && !isLoading) {
        return null;
    }
    const getSortButtonLabel = (columnKey, columnLabel) => {
        if (sortColumn === columnKey) {
            const directionLabel = sortDirection === 'asc' ? 'crescente' : 'decrescente';
            return `Ordenar por ${columnLabel}, atualmente ${directionLabel}`;
        }
        return `Ordenar por ${columnLabel}`;
    };
    const getAriaSort = (columnKey) => {
        if (sortColumn !== columnKey) {
            return 'none';
        }
        return sortDirection === 'asc' ? 'ascending' : 'descending';
    };
    return ((0, jsx_runtime_1.jsxs)("div", { style: styles.container, children: [(0, jsx_runtime_1.jsx)("div", { style: styles.headerLayer, children: (0, jsx_runtime_1.jsxs)("div", { style: styles.summaryLayer, children: [(0, jsx_runtime_1.jsx)("h2", { style: styles.summaryTitle, children: label ? `${label}` : 'Transações' }), (0, jsx_runtime_1.jsxs)("div", { style: styles.summaryMetrics, children: [(0, jsx_runtime_1.jsxs)("div", { style: styles.summaryMetric, children: [(0, jsx_runtime_1.jsx)("p", { style: styles.summaryMetricLabel, children: "Valor total" }), (0, jsx_runtime_1.jsx)("p", { style: styles.summaryMetricValue, children: (0, formatters_1.formatCurrency)(totalAmount) })] }), (0, jsx_runtime_1.jsxs)("div", { style: styles.summaryMetric, children: [(0, jsx_runtime_1.jsx)("p", { style: styles.summaryMetricLabel, children: "Parcelamentos" }), (0, jsx_runtime_1.jsx)("p", { style: styles.summaryMetricValue, children: `${installmentStats.count} • ${(0, formatters_1.formatCurrency)(installmentStats.total)}` })] })] })] }) }), isLoading && (0, jsx_runtime_1.jsx)("p", { style: styles.loadingMessage, children: "Carregando transa\u00E7\u00F5es..." }), error && !isLoading && (0, jsx_runtime_1.jsx)("p", { style: styles.error, children: error }), !error && !isLoading && !hasTransactions && ((0, jsx_runtime_1.jsx)("p", { style: styles.emptyMessage, children: "Nenhuma transa\u00E7\u00E3o encontrada para este m\u00EAs." })), !error && !isLoading && categoriesError && (0, jsx_runtime_1.jsx)("p", { style: styles.error, children: categoriesError }), !error && !isLoading && categoryActionError && ((0, jsx_runtime_1.jsx)("p", { style: styles.error, children: categoryActionError })), !error && !isLoading && categoryActionMessage && ((0, jsx_runtime_1.jsx)("p", { style: styles.success, children: categoryActionMessage })), !error && !isLoading && isCategoriesLoading && ((0, jsx_runtime_1.jsx)("p", { style: styles.infoMessage, children: "Carregando categorias para habilitar a edi\u00E7\u00E3o das transa\u00E7\u00F5es..." })), showCategorySummary && ((0, jsx_runtime_1.jsxs)("div", { style: styles.breakdownLayer, children: [(0, jsx_runtime_1.jsx)("div", { style: styles.breakdownHeader, children: (0, jsx_runtime_1.jsx)("h3", { style: styles.breakdownTitle, children: "Distribui\u00E7\u00E3o por categoria" }) }), (0, jsx_runtime_1.jsx)("div", { style: styles.tableWrapper, children: (0, jsx_runtime_1.jsxs)("table", { style: styles.table, "aria-label": label
                                ? `Distribuição por categoria de ${label}`
                                : 'Distribuição por categoria', children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { style: styles.tableHeader, children: "Categoria" }), (0, jsx_runtime_1.jsx)("th", { style: styles.tableHeader, children: "Valor total" }), (0, jsx_runtime_1.jsx)("th", { style: styles.tableHeader, children: "Participa\u00E7\u00E3o" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: categorySummary.items.map((item, index) => ((0, jsx_runtime_1.jsxs)("tr", { style: {
                                            ...styles.tableRow,
                                            ...(index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd)
                                        }, children: [(0, jsx_runtime_1.jsx)("td", { style: styles.tableCell, children: item.category }), (0, jsx_runtime_1.jsx)("td", { style: { ...styles.tableCell, ...styles.numericCell }, children: (0, formatters_1.formatCurrency)(item.amount) }), (0, jsx_runtime_1.jsx)("td", { style: { ...styles.tableCell, ...styles.numericCell }, children: formatPercentage(item.percentage) })] }, item.category))) })] }) })] })), showTable && ((0, jsx_runtime_1.jsxs)("div", { style: styles.transactionsLayer, children: [(0, jsx_runtime_1.jsx)("div", { style: styles.breakdownHeader, children: (0, jsx_runtime_1.jsx)("h3", { style: styles.breakdownTitle, children: "Transa\u00E7\u00F5es" }) }), (0, jsx_runtime_1.jsx)("div", { style: styles.tableWrapper, children: (0, jsx_runtime_1.jsxs)("table", { style: styles.table, "aria-label": label ? `Transações de ${label}` : 'Transações', children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [columns.map((column) => ((0, jsx_runtime_1.jsx)("th", { style: styles.tableHeader, "aria-sort": getAriaSort(column.key), children: (0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => onSort(column.key), "aria-label": getSortButtonLabel(column.key, column.label), style: {
                                                        ...styles.headerButton,
                                                        ...(sortColumn === column.key ? styles.headerButtonActive : null)
                                                    }, children: [(0, jsx_runtime_1.jsx)("span", { children: column.label }), renderSortIndicator(column.key)] }) }, column.key))), (0, jsx_runtime_1.jsx)("th", { style: styles.tableHeader })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: transactions.map((transaction, index) => {
                                        const cleanName = typeof transaction.cleanName === 'string' ? transaction.cleanName.trim() : '';
                                        const placeValue = typeof transaction.place === 'string' ? transaction.place.trim() : '';
                                        const primaryPlace = cleanName || placeValue || 'Não disponível';
                                        const showOriginal = cleanName && placeValue && cleanName !== placeValue;
                                        const categoryValue = typeof transaction.category === 'string' ? transaction.category.trim() : '';
                                        const categoryLabel = categoryValue && categoryValueToLabel.has(categoryValue)
                                            ? categoryValueToLabel.get(categoryValue)
                                            : '';
                                        const categoryDisplay = categoryLabel || categoryValue || 'Não categorizado';
                                        return ((0, jsx_runtime_1.jsxs)("tr", { style: {
                                                ...styles.tableRow,
                                                ...(index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd)
                                            }, children: [(0, jsx_runtime_1.jsx)("td", { style: styles.tableCell, children: (0, formatters_1.formatTransactionDate)(transaction.date) }), (0, jsx_runtime_1.jsx)("td", { style: styles.tableCell, children: (0, jsx_runtime_1.jsxs)("div", { style: styles.placeCell, children: [(0, jsx_runtime_1.jsx)("span", { style: styles.placePrimary, children: primaryPlace }), showOriginal && ((0, jsx_runtime_1.jsx)("span", { style: styles.placeSecondary, children: placeValue }))] }) }), (0, jsx_runtime_1.jsx)("td", { style: styles.tableCell, children: categoryDisplay }), (0, jsx_runtime_1.jsx)("td", { style: styles.tableCell, children: (0, formatters_1.formatInstallments)(transaction.installments) }), (0, jsx_runtime_1.jsx)("td", { style: styles.tableCell, children: (0, formatters_1.formatCurrency)(transaction.amount) }), (0, jsx_runtime_1.jsx)("td", { style: { ...styles.tableCell, ...styles.actionsCell }, children: editingTransactionId === transaction.id ? ((0, jsx_runtime_1.jsxs)("div", { style: styles.mappingEditor, children: [(0, jsx_runtime_1.jsxs)("label", { style: styles.mappingLabel, htmlFor: `clean-name-${transaction.id}`, children: ["Nome", (0, jsx_runtime_1.jsx)("input", { id: `clean-name-${transaction.id}`, type: "text", value: editingCleanName, onChange: (event) => setEditingCleanName(event.target.value), style: styles.textInput, disabled: savingTransactionId === transaction.id, placeholder: "Digite um nome amig\u00E1vel" })] }), (0, jsx_runtime_1.jsxs)("label", { style: styles.mappingLabel, htmlFor: `category-${transaction.id}`, children: ["Categoria", (0, jsx_runtime_1.jsxs)("select", { id: `category-${transaction.id}`, value: editingCategory, onChange: (event) => setEditingCategory(event.target.value), style: styles.select, disabled: savingTransactionId === transaction.id, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Sem categoria" }), categoryOptions.map((option) => ((0, jsx_runtime_1.jsx)("option", { value: option.value, children: `${option.label}` }, option.value)))] })] }), (0, jsx_runtime_1.jsxs)("div", { style: styles.categoryEditorActions, children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => handleSaveMapping(transaction), style: styles.inlineButtonPrimary, disabled: savingTransactionId === transaction.id, children: savingTransactionId === transaction.id ? 'Salvando...' : 'Salvar' }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: handleCancelCategoryEdit, style: styles.inlineButton, disabled: savingTransactionId === transaction.id, children: "Cancelar" })] })] })) : ((0, jsx_runtime_1.jsx)("button", { type: "button", style: styles.inlineButton, onClick: () => handleStartMappingEdit(transaction), disabled: Boolean(savingTransactionId), children: "Editar" })) })] }, transaction.id || `${transaction.date}-${index}`));
                                    }) })] }) })] }))] }));
}
