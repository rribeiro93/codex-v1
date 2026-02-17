import { useCallback, useEffect, useState } from 'react';
import {
  CategoryLine,
  MonthlyCategorySummaryEntry
} from '../../models/monthly-category-summary';

interface MonthlyCategorySummaryState {
  data: MonthlyCategorySummaryEntry[];
  categories: CategoryLine[];
  years: string[];
  selectedYear: string;
  isLoading: boolean;
  error: string;
}

export interface UseMonthlyCategorySummaryResult {
  data: MonthlyCategorySummaryEntry[];
  categories: CategoryLine[];
  years: string[];
  selectedYear: string;
  isLoading: boolean;
  error: string;
  hasYears: boolean;
  hasData: boolean;
  hasCategories: boolean;
  handleYearClick: (year: string) => void;
}

const initialState: MonthlyCategorySummaryState = {
  data: [],
  categories: [],
  years: [],
  selectedYear: '',
  isLoading: false,
  error: ''
};

const monthTranslations: Record<string, string> = {
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

function translateMonthLabel(label: string): string {
  const trimmed = label.trim();
  const normalized = trimmed.toLowerCase();
  const translated = monthTranslations[normalized];
  if (!translated) {
    return trimmed;
  }
  return translated.charAt(0).toUpperCase() + translated.slice(1);
}

export function useMonthlyCategorySummary(
  preferredSelectedYear?: string
): UseMonthlyCategorySummaryResult {
  const [state, setState] = useState<MonthlyCategorySummaryState>(initialState);
  const { data, categories, years, selectedYear, isLoading, error } = state;

  const hasYears = years.length > 0;
  const hasData = data.length > 0;
  const hasCategories = categories.length > 0;

  const loadSummary = useCallback(async (year?: string) => {
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
      const rawSummary: unknown[] = Array.isArray(body.summary) ? body.summary : [];
      const rawYears: unknown[] = Array.isArray(body.years) ? body.years : [];
      const responseYears = rawYears.map((value: unknown) => String(value));
      const responseSelectedYear =
        typeof body.selectedYear === 'string' ? body.selectedYear : '';
      const normalizedSelectedYear =
        responseSelectedYear && responseYears.includes(responseSelectedYear)
          ? responseSelectedYear
          : responseYears[0] ?? '';

      const rawCategories: unknown[] = Array.isArray(body.categories) ? body.categories : [];
      const normalizedCategories = rawCategories
        .map((entry: unknown) => {
          const record = typeof entry === 'object' && entry ? (entry as Record<string, unknown>) : {};
          const category =
            typeof record.category === 'string' ? record.category.trim().toUpperCase() : '';
          const name = typeof record.name === 'string' ? record.name.trim() : '';
          if (!category) {
            return null;
          }
          return { category, name: name || category };
        })
        .filter((entry: CategoryLine | null): entry is CategoryLine => Boolean(entry));

      const categorySet = new Set(normalizedCategories.map((entry) => entry.category));
      const normalizedSummary: MonthlyCategorySummaryEntry[] = rawSummary.map((entry) => {
          const record = typeof entry === 'object' && entry ? (entry as Record<string, unknown>) : {};
          const month = typeof record.month === 'string' ? record.month : '';
          const monthName =
            typeof record.monthName === 'string' && record.monthName
              ? record.monthName
              : '';
          const rawTotals =
            record.totalsByCategory && typeof record.totalsByCategory === 'object'
              ? (record.totalsByCategory as Record<string, unknown>)
              : {};
          const totalsByCategory: Record<string, number> = {};

          normalizedCategories.forEach((line: CategoryLine) => {
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
            const numericValue =
              typeof rawValue === 'number' && Number.isFinite(rawValue) ? rawValue : 0;
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
    } catch (fetchError) {
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

  useEffect(() => {
    loadSummary(preferredSelectedYear);
  }, [loadSummary, preferredSelectedYear]);

  useEffect(() => {
    if (!preferredSelectedYear || preferredSelectedYear === selectedYear) {
      return;
    }
    if (years.length > 0 && !years.includes(preferredSelectedYear)) {
      return;
    }
    loadSummary(preferredSelectedYear);
  }, [loadSummary, preferredSelectedYear, selectedYear, years]);

  const handleYearClick = useCallback(
    (nextYear: string) => {
      if (!nextYear || nextYear === selectedYear) {
        return;
      }
      loadSummary(nextYear);
    },
    [loadSummary, selectedYear]
  );

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
