"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMonthlyCategorySummary = useMonthlyCategorySummary;
const react_1 = require("react");
const initialState = {
    data: [],
    categories: [],
    years: [],
    selectedYear: '',
    isLoading: false,
    error: ''
};
const monthTranslations = {
    january: 'Janeiro',
    february: 'Fevereiro',
    march: 'Março',
    april: 'Abril',
    may: 'Maio',
    june: 'Junho',
    july: 'Julho',
    august: 'Agosto',
    september: 'Setembro',
    october: 'Outubro',
    november: 'Novembro',
    december: 'Dezembro'
};
function translateMonthLabel(label) {
    const trimmed = label.trim();
    const normalized = trimmed.toLowerCase();
    const translated = monthTranslations[normalized];
    if (!translated) {
        return trimmed;
    }
    return translated.charAt(0).toUpperCase() + translated.slice(1);
}
function useMonthlyCategorySummary() {
    const [state, setState] = (0, react_1.useState)(initialState);
    const { data, categories, years, selectedYear, isLoading, error } = state;
    const hasYears = years.length > 0;
    const hasData = data.length > 0;
    const hasCategories = categories.length > 0;
    const loadSummary = (0, react_1.useCallback)(async (year) => {
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
            const response = await fetch(`/api/statements/category-summary${query}`);
            if (!response.ok) {
                throw new Error(`Failed with status ${response.status}`);
            }
            const body = await response.json();
            const rawSummary = Array.isArray(body.summary) ? body.summary : [];
            const responseYears = Array.isArray(body.years)
                ? body.years.map((value) => String(value))
                : [];
            const responseSelectedYear = typeof body.selectedYear === 'string' ? body.selectedYear : '';
            const normalizedSelectedYear = responseSelectedYear && responseYears.includes(responseSelectedYear)
                ? responseSelectedYear
                : responseYears[0] ?? '';
            const normalizedCategories = (Array.isArray(body.categories) ? body.categories : [])
                .map((entry) => {
                const category = typeof entry?.category === 'string' ? entry.category.trim().toUpperCase() : '';
                const name = typeof entry?.name === 'string' ? entry.name.trim() : '';
                if (!category) {
                    return null;
                }
                return { category, name: name || category };
            })
                .filter((entry) => Boolean(entry));
            const categorySet = new Set(normalizedCategories.map((entry) => entry.category));
            const normalizedSummary = rawSummary.map((entry) => {
                const month = typeof entry?.month === 'string' ? entry.month : '';
                const monthName = typeof entry?.monthName === 'string' && entry.monthName
                    ? entry.monthName
                    : '';
                const rawTotals = entry?.totalsByCategory && typeof entry.totalsByCategory === 'object'
                    ? entry.totalsByCategory
                    : {};
                const totalsByCategory = {};
                normalizedCategories.forEach((line) => {
                    const rawValue = rawTotals[line.category];
                    const numericValue = typeof rawValue === 'number' && Number.isFinite(rawValue)
                        ? rawValue
                        : 0;
                    totalsByCategory[line.category] = Number.parseFloat(numericValue.toFixed(2));
                });
                Object.entries(rawTotals).forEach(([categoryCode, rawValue]) => {
                    if (categorySet.has(categoryCode)) {
                        return;
                    }
                    const numericValue = typeof rawValue === 'number' && Number.isFinite(rawValue) ? rawValue : 0;
                    totalsByCategory[categoryCode] = Number.parseFloat(numericValue.toFixed(2));
                });
                const displayMonth = translateMonthLabel(monthName || month);
                return {
                    month,
                    monthName,
                    displayMonth,
                    totalsByCategory
                };
            });
            setState((prev) => ({
                ...prev,
                data: normalizedSummary,
                categories: normalizedCategories,
                years: responseYears,
                selectedYear: normalizedSelectedYear,
                isLoading: false,
                error: ''
            }));
        }
        catch (fetchError) {
            console.error('Não foi possível carregar o resumo mensal por categoria', fetchError);
            setState((prev) => ({
                ...prev,
                data: [],
                categories: [],
                years: [],
                selectedYear: '',
                isLoading: false,
                error: 'Não foi possível carregar o gráfico por categoria. Tente novamente.'
            }));
        }
    }, []);
    (0, react_1.useEffect)(() => {
        loadSummary();
    }, [loadSummary]);
    const handleYearClick = (0, react_1.useCallback)((nextYear) => {
        if (!nextYear || nextYear === selectedYear) {
            return;
        }
        loadSummary(nextYear);
    }, [loadSummary, selectedYear]);
    return {
        data,
        categories,
        years,
        selectedYear,
        isLoading,
        error,
        hasYears,
        hasData,
        hasCategories,
        handleYearClick
    };
}
