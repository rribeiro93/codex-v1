import React, { useEffect, useMemo, useState } from 'react';
import {
  formatCurrency,
  formatInstallments,
  formatTransactionDate
} from '../utils/formatters';
import { MonthlyTransaction } from '../../models/monthly-transaction';
import {
  TransactionMappingUpdates,
  TransactionSortColumn
} from '../hooks/useMonthlySummary';

interface CategoryOption {
  id: string;
  label: string;
  value: string;
}

interface InstallmentStats {
  count: number;
  total: number;
}

interface CategorySummaryItem {
  category: string;
  amount: number;
  percentage: number;
}

interface CategorySummary {
  totalAmount: number;
  items: CategorySummaryItem[];
}

function isInstallmentTransaction(installments: MonthlyTransaction['installments']) {
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

function formatPercentage(value: number) {
  if (!Number.isFinite(value)) {
    return '0%';
  }
  return `${value.toFixed(1)}%`;
}

type RawCategory = {
  id?: unknown;
  _id?: unknown;
  name?: unknown;
  category?: unknown;
};

function createCategoryOption(category: RawCategory | null | undefined): CategoryOption | null {
  if (!category || typeof category !== 'object') {
    return null;
  }

  const id =
    typeof category.id === 'string'
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

const styles: Record<string, React.CSSProperties> = {
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

const columns: Array<{ key: TransactionSortColumn; label: string; isNumeric: boolean }> = [
  { key: 'date', label: 'Data', isNumeric: false },
  { key: 'place', label: 'Estabelecimento', isNumeric: false },
  { key: 'category', label: 'Categoria', isNumeric: false },
  // { key: 'owner', label: 'Responsável', isNumeric: false },
  { key: 'installments', label: 'Parcelas', isNumeric: false },
  { key: 'amount', label: 'Valor', isNumeric: true }
];

interface TransactionsSectionProps {
  selectedMonth: string;
  label: string;
  isLoading: boolean;
  error: string;
  transactions: MonthlyTransaction[];
  hasTransactions: boolean;
  sortColumn: TransactionSortColumn | '';
  sortDirection: 'asc' | 'desc';
  onSort: (column: TransactionSortColumn) => void;
  onTransactionMappingChange?: (transactionId: string, updates?: TransactionMappingUpdates) => void;
  totalAmount: number;
  installmentStats: InstallmentStats;
}

export default function TransactionsSection({
  selectedMonth,
  label,
  isLoading,
  error,
  transactions,
  hasTransactions,
  sortColumn,
  sortDirection,
  onSort,
  onTransactionMappingChange = () => {},
  totalAmount = 0,
  installmentStats = { count: 0, total: 0 }
}: TransactionsSectionProps) {
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [categoriesError, setCategoriesError] = useState('');
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState('');
  const [editingCategory, setEditingCategory] = useState('');
  const [editingCleanName, setEditingCleanName] = useState('');
  const [savingTransactionId, setSavingTransactionId] = useState('');
  const [categoryActionError, setCategoryActionError] = useState('');
  const [categoryActionMessage, setCategoryActionMessage] = useState('');
  const categoryValueToLabel = useMemo(() => {
    const map = new Map<string, string>();
    categoryOptions.forEach((option) => {
      if (option && option.value) {
        map.set(option.value, option.label);
      }
    });
    return map;
  }, [categoryOptions]);

  useEffect(() => {
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
          .map((item) => createCategoryOption(item as RawCategory))
          .filter((value): value is CategoryOption => Boolean(value))
          .sort((a, b) =>
            a.label.localeCompare(b.label, undefined, {
              sensitivity: 'base'
            })
          );

        if (isMounted) {
          setCategoryOptions(formatted);
        }
      } catch (categoriesLoadError) {
        console.error('Não foi possível carregar a lista de categorias', categoriesLoadError);
        if (isMounted) {
          setCategoriesError('Não foi possível carregar a lista de categorias. A seleção ficará limitada.');
        }
      } finally {
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

  useEffect(() => {
    if (!editingTransactionId) {
      return;
    }

    const stillExists = transactions.some(
      (transaction) => transaction.id === editingTransactionId
    );
    if (!stillExists) {
      setEditingTransactionId('');
      setEditingCategory('');
      setEditingCleanName('');
    }
  }, [transactions, editingTransactionId]);
  const handleStartMappingEdit = (transaction: MonthlyTransaction) => {
    if (!transaction) {
      return;
    }
    setEditingTransactionId(transaction.id);
    setEditingCategory(typeof transaction.category === 'string' ? transaction.category : '');
    const initialCleanName =
      typeof transaction.cleanName === 'string' && transaction.cleanName.trim()
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

  const handleSaveMapping = async (transaction: MonthlyTransaction) => {
    if (!transaction || !transaction.id) {
      return;
    }

    const trimmedCategory = typeof editingCategory === 'string' ? editingCategory.trim() : '';
    const trimmedCleanName =
      typeof editingCleanName === 'string' ? editingCleanName.trim() : '';
    const payload: Record<string, string> = {};
    if (typeof editingCategory === 'string') {
      payload.category = trimmedCategory;
    }
    if (typeof editingCleanName === 'string') {
      payload.cleanName = trimmedCleanName;
    }

    if (typeof transaction.mappingId === 'string' && transaction.mappingId) {
      payload.id = transaction.mappingId;
    } else {
      const fallbackTransaction =
        (typeof transaction.mappingTransaction === 'string' && transaction.mappingTransaction.trim()) ||
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
      const updatedCategory =
        typeof place?.category === 'string' ? place.category : trimmedCategory;
      const updatedCleanName =
        typeof place?.cleanName === 'string' ? place.cleanName : trimmedCleanName;
      const updatedMappingId = typeof place?.id === 'string' ? place.id : transaction.mappingId;
      const updatedMappingTransaction =
        typeof place?.transaction === 'string'
          ? place.transaction
          : transaction.mappingTransaction;
      const friendlyName =
        (typeof updatedCleanName === 'string' && updatedCleanName.trim()) ||
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
    } catch (saveError) {
      console.error('Não foi possível atualizar a categoria da transação', saveError);
      setCategoryActionError('Não foi possível atualizar o mapeamento. Tente novamente.');
    } finally {
      setSavingTransactionId('');
    }
  };

  const showTable = !isLoading && !error && hasTransactions;
  const categorySummary = useMemo<CategorySummary>(() => {
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
      const categoryValue =
        typeof transaction.category === 'string' && transaction.category.trim()
          ? transaction.category.trim()
          : 'Não categorizado';
      const label =
        categoryValue && categoryValueToLabel.has(categoryValue)
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

  const renderSortIndicator = (columnKey: TransactionSortColumn) => {
    const isActive = sortColumn === columnKey;
    const symbol = sortDirection === 'asc' ? '^' : 'v';
    return (
      <span
        style={{
          ...styles.sortIndicator,
          ...(isActive ? null : styles.sortIndicatorHidden)
        }}
        aria-hidden="true"
      >
        {symbol}
      </span>
    );
  };

  if (!selectedMonth && !isLoading) {
    return null;
  }

  const getSortButtonLabel = (columnKey: TransactionSortColumn, columnLabel: string) => {
    if (sortColumn === columnKey) {
      const directionLabel = sortDirection === 'asc' ? 'crescente' : 'decrescente';
      return `Ordenar por ${columnLabel}, atualmente ${directionLabel}`;
    }
    return `Ordenar por ${columnLabel}`;
  };

  const getAriaSort = (columnKey: TransactionSortColumn) => {
    if (sortColumn !== columnKey) {
      return 'none';
    }
    return sortDirection === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerLayer}>
        <div style={styles.summaryLayer}>
          <h2 style={styles.summaryTitle}>{label ? `${label}` : 'Transações'}</h2>
          <div style={styles.summaryMetrics}>
            <div style={styles.summaryMetric}>
              <p style={styles.summaryMetricLabel}>Valor total</p>
              <p style={styles.summaryMetricValue}>{formatCurrency(totalAmount)}</p>
            </div>
            <div style={styles.summaryMetric}>
              <p style={styles.summaryMetricLabel}>Parcelamentos</p>
              <p style={styles.summaryMetricValue}>
                {`${installmentStats.count} • ${formatCurrency(installmentStats.total)}`}
              </p>
            </div>
          </div>
        </div>
      </div>
      {isLoading && <p style={styles.loadingMessage}>Carregando transações...</p>}
      {error && !isLoading && <p style={styles.error}>{error}</p>}
      {!error && !isLoading && !hasTransactions && (
        <p style={styles.emptyMessage}>Nenhuma transação encontrada para este mês.</p>
      )}
      {!error && !isLoading && categoriesError && <p style={styles.error}>{categoriesError}</p>}
      {!error && !isLoading && categoryActionError && (
        <p style={styles.error}>{categoryActionError}</p>
      )}
      {!error && !isLoading && categoryActionMessage && (
        <p style={styles.success}>{categoryActionMessage}</p>
      )}
      {!error && !isLoading && isCategoriesLoading && (
        <p style={styles.infoMessage}>Carregando categorias para habilitar a edição das transações...</p>
      )}
      {showCategorySummary && (
        <div style={styles.breakdownLayer}>
          <div style={styles.breakdownHeader}>
            <h3 style={styles.breakdownTitle}>Distribuição por categoria</h3>
          </div>
          <div style={styles.tableWrapper}>
            <table
              style={styles.table}
              aria-label={
                label
                  ? `Distribuição por categoria de ${label}`
                  : 'Distribuição por categoria'
              }
            >
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Categoria</th>
                  <th style={styles.tableHeader}>Valor total</th>
                  <th style={styles.tableHeader}>Participação</th>
                </tr>
              </thead>
              <tbody>
                {categorySummary.items.map((item, index) => (
                  <tr
                    key={item.category}
                    style={{
                      ...styles.tableRow,
                      ...(index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd)
                    }}
                  >
                    <td style={styles.tableCell}>{item.category}</td>
                    <td style={{ ...styles.tableCell, ...styles.numericCell }}>
                      {formatCurrency(item.amount)}
                    </td>
                    <td style={{ ...styles.tableCell, ...styles.numericCell }}>
                      {formatPercentage(item.percentage)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {showTable && (
        <div style={styles.transactionsLayer}>
          <div style={styles.breakdownHeader}>
            <h3 style={styles.breakdownTitle}>Transações</h3>
          </div>
          <div style={styles.tableWrapper}>
            <table
              style={styles.table}
              aria-label={label ? `Transações de ${label}` : 'Transações'}
            >
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    style={styles.tableHeader}
                    aria-sort={getAriaSort(column.key)}
                  >
                    <button
                      type="button"
                      onClick={() => onSort(column.key)}
                      aria-label={getSortButtonLabel(column.key, column.label)}
                      style={{
                        ...styles.headerButton,
                        ...(sortColumn === column.key ? styles.headerButtonActive : null)
                      }}
                    >
                      <span>{column.label}</span>
                      {renderSortIndicator(column.key)}
                    </button>
                  </th>
                ))}
                <th style={styles.tableHeader}></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, index) => {
                const cleanName =
                  typeof transaction.cleanName === 'string' ? transaction.cleanName.trim() : '';
                const placeValue =
                  typeof transaction.place === 'string' ? transaction.place.trim() : '';
                const primaryPlace = cleanName || placeValue || 'Não disponível';
                const showOriginal = cleanName && placeValue && cleanName !== placeValue;
                const categoryValue =
                  typeof transaction.category === 'string' ? transaction.category.trim() : '';
                const categoryLabel =
                  categoryValue && categoryValueToLabel.has(categoryValue)
                    ? categoryValueToLabel.get(categoryValue)
                    : '';
                const categoryDisplay = categoryLabel || categoryValue || 'Não categorizado';

                return (
                  <tr
                    key={transaction.id || `${transaction.date}-${index}`}
                    style={{
                      ...styles.tableRow,
                      ...(index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd)
                    }}
                  >
                    <td style={styles.tableCell}>{formatTransactionDate(transaction.date)}</td>
                    <td style={styles.tableCell}>
                      <div style={styles.placeCell}>
                        <span style={styles.placePrimary}>{primaryPlace}</span>
                        {showOriginal && (
                          <span style={styles.placeSecondary}>{placeValue}</span>
                        )}
                      </div>
                    </td>
                    <td style={styles.tableCell}>{categoryDisplay}</td>
                    {/* <td style={styles.tableCell}>{transaction.owner || 'Não disponível'}</td> */}
                    <td style={styles.tableCell}>{formatInstallments(transaction.installments)}</td>
                    <td style={styles.tableCell}>{formatCurrency(transaction.amount)}</td>
                    <td style={{ ...styles.tableCell, ...styles.actionsCell }}>
                      {editingTransactionId === transaction.id ? (
                        <div style={styles.mappingEditor}>
                          <label style={styles.mappingLabel} htmlFor={`clean-name-${transaction.id}`}>
                            Nome
                          <input
                              id={`clean-name-${transaction.id}`}
                              type="text"
                              value={editingCleanName}
                              onChange={(event) => setEditingCleanName(event.target.value)}
                              style={styles.textInput}
                              disabled={savingTransactionId === transaction.id}
                              placeholder="Digite um nome amigável"
                            />
                          </label>
                          <label style={styles.mappingLabel} htmlFor={`category-${transaction.id}`}>
                            Categoria
                            <select
                              id={`category-${transaction.id}`}
                              value={editingCategory}
                              onChange={(event) => setEditingCategory(event.target.value)}
                              style={styles.select}
                              disabled={savingTransactionId === transaction.id}
                            >
                              <option value="">Sem categoria</option>
                              {categoryOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {`${option.label}`}
                                </option>
                              ))}
                            </select>
                          </label>
                          <div style={styles.categoryEditorActions}>
                            <button
                              type="button"
                              onClick={() => handleSaveMapping(transaction)}
                              style={styles.inlineButtonPrimary}
                              disabled={savingTransactionId === transaction.id}
                            >
                              {savingTransactionId === transaction.id ? 'Salvando...' : 'Salvar'}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelCategoryEdit}
                              style={styles.inlineButton}
                              disabled={savingTransactionId === transaction.id}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          style={styles.inlineButton}
                          onClick={() => handleStartMappingEdit(transaction)}
                          disabled={Boolean(savingTransactionId)}
                        >
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}
