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
  if (typeof label !== 'string') {
    return label;
  }
  const trimmed = label.trim();
  const normalized = trimmed.toLowerCase();
  const translated = monthTranslations[normalized];
  if (!translated) {
    return trimmed;
  }
  return translated.charAt(0).toUpperCase() + translated.slice(1);
}

function translateCompositeLabel(label) {
  if (typeof label !== 'string') {
    return label;
  }
  const trimmed = label.trim();
  if (!trimmed) {
    return trimmed;
  }
  const [firstWord, ...rest] = trimmed.split(' ');
  const translatedFirst = translateMonthLabel(firstWord);
  if (!rest.length) {
    return translatedFirst;
  }
  return `${translatedFirst} ${rest.join(' ')}`;
}

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
    case 'place': {
      const cleanName = typeof item.cleanName === 'string' ? item.cleanName.trim() : '';
      const place =
        cleanName || (typeof item.place === 'string' ? item.place.trim() : '');
      if (!place) {
        return null;
      }
      return place.toLocaleLowerCase();
    }
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
          const month = typeof item.month === 'string' && item.month ? item.month : '';
          const monthName =
            typeof item.monthName === 'string' && item.monthName ? item.monthName : '';
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
          const displayMonth = monthName ? translateMonthLabel(monthName) : translateCompositeLabel(month);

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
    console.error('Não foi possível carregar o resumo mensal', err);
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
          error: 'Não foi possível carregar os totais mensais. Tente novamente.',
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
          const cleanName =
            typeof transaction.cleanName === 'string' ? transaction.cleanName : '';
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
          const mappingId =
            typeof transaction.mappingId === 'string' ? transaction.mappingId : '';
          const mappingTransaction =
            typeof transaction.mappingTransaction === 'string'
              ? transaction.mappingTransaction
              : '';

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
            cleanName,
            category,
            owner,
            amount,
            installments: normalizedInstallments,
            fileName,
            mappingId,
            mappingTransaction
          };
        });

        const finalLabelBase = normalizedMonthName || displayLabel || targetMonth;
        const localizedBase = translateCompositeLabel(finalLabelBase);
        const finalLabel =
          selectedYear && localizedBase && !localizedBase.includes(selectedYear)
            ? `${localizedBase} ${selectedYear}`
            : localizedBase;

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
        console.error('Não foi possível carregar as transações do mês selecionado', err);
        setState((prev) => ({
          ...prev,
          transactions: [],
          isTransactionsLoading: false,
          transactionsError: 'Não foi possível carregar as transações. Tente novamente.',
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

      const baseLabel =
        selectedYear && display && !display.includes(selectedYear)
          ? `${display} ${selectedYear}`
          : display;

      const localizedLabel = translateCompositeLabel(baseLabel);

      loadTransactions(monthValue, localizedLabel);
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

  const handleTransactionMappingChange = useCallback((transactionId, updates = {}) => {
    if (!transactionId) {
      return;
    }

    setState((prev) => {
      const mappedTransactions = prev.transactions.map((transaction) => {
        if (transaction.id !== transactionId) {
          return transaction;
        }
        return {
          ...transaction,
          ...(typeof updates.category === 'string' ? { category: updates.category } : null),
          ...(typeof updates.cleanName === 'string' ? { cleanName: updates.cleanName } : null),
          ...(typeof updates.mappingId === 'string' ? { mappingId: updates.mappingId } : null),
          ...(typeof updates.mappingTransaction === 'string'
            ? { mappingTransaction: updates.mappingTransaction }
            : null)
        };
      });

      return {
        ...prev,
        transactions: mappedTransactions
      };
    });
  }, []);

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

  const installmentStats = useMemo(() => {
    if (!transactions.length) {
      return { count: 0, total: 0 };
    }

    return transactions.reduce(
      (acc, transaction) => {
        if (!transaction.installments || typeof transaction.installments !== 'object') {
          return acc;
        }

        const current = Number(transaction.installments.current);
        const total = Number(transaction.installments.total);
        if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 1 || current <= 0) {
          return acc;
        }

        const amount = Number(transaction.amount);
        const numericAmount = Number.isFinite(amount) ? amount : 0;

        return {
          count: acc.count + 1,
          total: acc.total + numericAmount
        };
      },
      { count: 0, total: 0 }
    );
  }, [transactions]);

  const transactionsTotalAmount = useMemo(() => {
    if (!transactions.length) {
      return 0;
    }
    return transactions.reduce((sum, transaction) => {
      const amount = Number(transaction.amount);
      return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);
  }, [transactions]);

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
    handleTransactionMappingChange,
    yearlyAverage,
    transactionsTotalAmount,
    installmentStats
  };
}
