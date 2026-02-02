import { useCallback, useEffect, useMemo, useState } from 'react';

const initialState = {
  data: [],
  years: [],
  selectedYear: '',
  selectedMonth: '',
  selectedMonthLabel: '',
  transactions: [],
  isLoading: false,
  isTransactionsLoading: false,
  error: '',
  transactionsError: '',
  sortColumn: '',
  sortDirection: 'asc',
  yearlyAverage: 0
};

const resolveSortValue = (item, columnKey) => {
  switch (columnKey) {
    case 'date': {
      const timestamp = Date.parse(item.date);
      return Number.isNaN(timestamp) ? null : timestamp;
    }
    case 'amount': {
      const value = Number(item.amount);
      return Number.isFinite(value) ? value : null;
    }
    case 'installments': {
      if (!item.installments || typeof item.installments !== 'object') {
        return null;
      }
      const current = Number(item.installments.current);
      const total = Number(item.installments.total);
      if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) {
        return null;
      }
      return total * 1000 + current;
    }
    case 'place':
    case 'category':
    case 'owner': {
      const rawValue = typeof item[columnKey] === 'string' ? item[columnKey].trim() : '';
      if (!rawValue) {
        return null;
      }
      return rawValue.toLocaleLowerCase();
    }
    default:
      return null;
  }
};

export function useMonthlySummary() {
  const [state, setState] = useState(initialState);

  const {
    data,
    years,
    selectedYear,
    selectedMonth,
    selectedMonthLabel,
    transactions,
    isLoading,
    isTransactionsLoading,
    error,
    transactionsError,
    sortColumn,
    sortDirection,
    yearlyAverage
  } = state;

  const hasData = data.length > 0;
  const hasYears = years.length > 0;
  const hasTransactions = transactions.length > 0;

  const loadSummary = useCallback(
    async (year) => {
      if (typeof fetch !== 'function') {
        return;
      }

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: '',
        transactionsError: '',
        isTransactionsLoading: false,
        transactions: [],
        selectedMonth: '',
        selectedMonthLabel: '',
        sortColumn: '',
        sortDirection: 'asc',
        yearlyAverage: 0,
        ...(typeof year === 'string' && year ? { selectedYear: year } : {})
      }));

      try {
        const query = typeof year === 'string' && year ? `?year=${encodeURIComponent(year)}` : '';
        const response = await fetch(`/api/statements/summary${query}`);
        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }

        const body = await response.json();
        const summary = Array.isArray(body.summary) ? body.summary : [];
        const responseYears = Array.isArray(body.years)
          ? body.years.map((value) => String(value))
          : [];
        const responseSelectedYear =
          typeof body.selectedYear === 'string' ? body.selectedYear : '';
        const normalizedSelectedYear =
          responseSelectedYear && responseYears.includes(responseSelectedYear)
            ? responseSelectedYear
            : responseYears[0] ?? '';

        const normalized = summary.map((item) => {
          const month = typeof item.month === 'string' && item.month ? item.month : 'Unknown';
          const monthName =
            typeof item.monthName === 'string' && item.monthName ? item.monthName : 'Unknown';
          const totalAmount =
            typeof item.totalAmount === 'number' && Number.isFinite(item.totalAmount)
              ? item.totalAmount
              : 0;
          const installmentAmount =
            typeof item.installmentAmount === 'number' && Number.isFinite(item.installmentAmount)
              ? item.installmentAmount
              : 0;
          const nonInstallmentAmount =
            typeof item.nonInstallmentAmount === 'number' &&
            Number.isFinite(item.nonInstallmentAmount)
              ? item.nonInstallmentAmount
              : 0;
          const safeInstallments = installmentAmount > 0 ? installmentAmount : 0;
          const safeNonInstallments = nonInstallmentAmount > 0 ? nonInstallmentAmount : 0;
          const displayMonth = monthName !== 'Unknown' ? monthName : month;

          return {
            month,
            monthName,
            displayMonth,
            totalAmount,
            installmentAmount: safeInstallments,
            nonInstallmentAmount: safeNonInstallments
          };
        });

        const averageTotal =
          normalized.length > 0
            ? normalized.reduce((acc, item) => acc + item.totalAmount, 0) / normalized.length
            : 0;

        setState((prev) => ({
          ...prev,
          data: normalized,
          years: responseYears,
          selectedYear: normalizedSelectedYear,
          isLoading: false,
          error: '',
          transactions: [],
          transactionsError: '',
          selectedMonth: '',
          selectedMonthLabel: '',
          isTransactionsLoading: false,
          sortColumn: '',
          sortDirection: 'asc',
          yearlyAverage: averageTotal
        }));
      } catch (err) {
        console.error('Failed to load monthly summary', err);
        setState((prev) => ({
          ...prev,
          data: [],
          years: [],
          selectedYear: '',
          selectedMonth: '',
          selectedMonthLabel: '',
          transactions: [],
          isLoading: false,
          isTransactionsLoading: false,
          error: 'Unable to load monthly totals. Please try again.',
          transactionsError: '',
          sortColumn: '',
          sortDirection: 'asc',
          yearlyAverage: 0
        }));
      }
    },
    []
  );

  const loadTransactions = useCallback(
    async (monthValue, displayLabel) => {
      if (typeof fetch !== 'function') {
        return;
      }

      const targetMonth = typeof monthValue === 'string' ? monthValue : '';
      if (!targetMonth) {
        return;
      }

      if (
        targetMonth === selectedMonth &&
        hasTransactions &&
        !transactionsError &&
        !isTransactionsLoading
      ) {
        return;
      }

      setState((prev) => ({
        ...prev,
        selectedMonth: targetMonth,
        selectedMonthLabel: displayLabel || prev.selectedMonthLabel || '',
        transactions: [],
        transactionsError: '',
        isTransactionsLoading: true,
        sortColumn: '',
        sortDirection: 'asc'
      }));

      try {
        const response = await fetch(
          `/api/statements/transactions?month=${encodeURIComponent(targetMonth)}`
        );
        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }

        const body = await response.json();
        const payloadTransactions = Array.isArray(body.transactions) ? body.transactions : [];
        const normalizedMonthName =
          typeof body.monthName === 'string' && body.monthName.trim()
            ? body.monthName.trim()
            : '';

        const normalizedTransactions = payloadTransactions.map((transaction, index) => {
          const date = typeof transaction.date === 'string' ? transaction.date : '';
          const place = typeof transaction.place === 'string' ? transaction.place : '';
          const category =
            typeof transaction.category === 'string' ? transaction.category : '';
          const owner = typeof transaction.owner === 'string' ? transaction.owner : '';
          const amount =
            typeof transaction.amount === 'number' && Number.isFinite(transaction.amount)
              ? transaction.amount
              : 0;
          const statementId =
            typeof transaction.statementId === 'string' ? transaction.statementId : '';
          const fileName = typeof transaction.fileName === 'string' ? transaction.fileName : '';

          const normalizedInstallments = (() => {
            if (!transaction.installments || typeof transaction.installments !== 'object') {
              return null;
            }
            const current = Number.parseInt(transaction.installments.current, 10);
            const total = Number.parseInt(transaction.installments.total, 10);
            if (Number.isNaN(current) || Number.isNaN(total)) {
              return null;
            }
            return { current, total };
          })();

          return {
            id: statementId ? `${statementId}-${index}` : `${targetMonth}-${index}`,
            date,
            place,
            category,
            owner,
            amount,
            installments: normalizedInstallments,
            fileName
          };
        });

        const finalLabelBase = normalizedMonthName || displayLabel || targetMonth;
        const finalLabel =
          selectedYear && finalLabelBase && !finalLabelBase.includes(selectedYear)
            ? `${finalLabelBase} ${selectedYear}`
            : finalLabelBase;

        setState((prev) => ({
          ...prev,
          selectedMonth: targetMonth,
          selectedMonthLabel: finalLabel,
          transactions: normalizedTransactions,
          transactionsError: '',
          isTransactionsLoading: false,
          sortColumn: '',
          sortDirection: 'asc'
        }));
      } catch (err) {
        console.error('Failed to load transactions for month', err);
        setState((prev) => ({
          ...prev,
          transactions: [],
          isTransactionsLoading: false,
          transactionsError: 'Unable to load transactions. Please try again.',
          sortColumn: '',
          sortDirection: 'asc'
        }));
      }
    },
    [hasTransactions, isTransactionsLoading, selectedMonth, selectedYear, transactionsError]
  );

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleBarClick = useCallback(
    (barData) => {
      if (!barData) {
        return;
      }

      const payload = typeof barData.payload === 'object' ? barData.payload : barData;
      if (!payload || typeof payload !== 'object') {
        return;
      }

      const monthValue =
        typeof payload.month === 'string' && payload.month ? payload.month : '';
      if (!monthValue) {
        return;
      }

      if (isTransactionsLoading && monthValue === selectedMonth) {
        return;
      }

      const display =
        (typeof payload.displayMonth === 'string' && payload.displayMonth) ||
        (typeof payload.monthName === 'string' && payload.monthName) ||
        monthValue;

      const label =
        selectedYear && display && !display.includes(selectedYear)
          ? `${display} ${selectedYear}`
          : display;

      loadTransactions(monthValue, label);
    },
    [isTransactionsLoading, loadTransactions, selectedMonth, selectedYear]
  );

  const handleYearClick = useCallback(
    (nextYear) => {
      if (!nextYear || nextYear === selectedYear) {
        return;
      }
      loadSummary(nextYear);
    },
    [loadSummary, selectedYear]
  );

  const sortedTransactions = useMemo(() => {
    if (!sortColumn) {
      return transactions;
    }

    const next = [...transactions];

    next.sort((a, b) => {
      const valueA = resolveSortValue(a, sortColumn);
      const valueB = resolveSortValue(b, sortColumn);
      const isEmptyA = valueA === null || typeof valueA === 'undefined';
      const isEmptyB = valueB === null || typeof valueB === 'undefined';

      if (isEmptyA && isEmptyB) {
        return 0;
      }
      if (isEmptyA) {
        return 1;
      }
      if (isEmptyB) {
        return -1;
      }

      if (valueA < valueB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return next;
  }, [sortColumn, sortDirection, transactions]);

  const handleSort = useCallback((columnKey) => {
    setState((prev) => {
      if (prev.sortColumn === columnKey) {
        const nextDirection = prev.sortDirection === 'asc' ? 'desc' : 'asc';
        return {
          ...prev,
          sortDirection: nextDirection
        };
      }

      return {
        ...prev,
        sortColumn: columnKey,
        sortDirection: 'asc'
      };
    });
  }, []);

  return {
    data,
    years,
    selectedYear,
    selectedMonth,
    selectedMonthLabel,
    isLoading,
    isTransactionsLoading,
    error,
    transactionsError,
    hasData,
    hasYears,
    hasTransactions,
    handleYearClick,
    handleBarClick,
    loadTransactions,
    sortedTransactions,
    sortColumn,
    sortDirection,
    handleSort,
    yearlyAverage
  };
}
