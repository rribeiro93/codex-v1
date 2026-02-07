import type { CsvTransaction } from '../../src/models/csv-transaction';
import { MONTH_NAMES } from '../../src/models/month-names';

export function getMonthNameFromIsoMonth(value: string): string {
  if (typeof value !== 'string') {
    return '';
  }

  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return '';
  }

  const monthIndex = Number.parseInt(match[2], 10) - 1;
  if (Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return '';
  }

  return MONTH_NAMES[monthIndex] ?? '';
}

export function extractIsoMonthFromFileName(fileName: unknown): string {
  if (typeof fileName !== 'string') {
    return '';
  }

  const formatted = fileName.trim();
  if (!formatted) {
    return '';
  }

  const match = formatted.match(/Fatura(\d{4}-\d{2})-\d{2}\.csv$/i);
  return match ? match[1] : '';
}

export function extractIsoMonthFromTransactions(transactions: CsvTransaction[] = []): string {
  for (const transaction of transactions) {
    if (!transaction || typeof transaction.date !== 'string') {
      continue;
    }

    const match = transaction.date.match(/^(\d{4})-(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
  }

  return '';
}

export function resolveStatementMonthName(
  month: unknown,
  fileName: unknown,
  transactions: CsvTransaction[],
  providedMonthName: unknown
): string {
  if (typeof providedMonthName === 'string') {
    const trimmed = providedMonthName.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  const candidates = [
    typeof month === 'string' ? month : '',
    extractIsoMonthFromFileName(fileName),
    extractIsoMonthFromTransactions(transactions)
  ].filter(Boolean);

  for (const isoMonth of candidates) {
    const monthName = getMonthNameFromIsoMonth(isoMonth);
    if (monthName) {
      return monthName;
    }
  }

  return '';
}

export function sanitizeTransaction(transaction: Record<string, unknown> = {}): CsvTransaction | null {
  if (!transaction || typeof transaction !== 'object') {
    return null;
  }

  const sanitized: CsvTransaction = {
    date: typeof transaction.date === 'string' ? transaction.date : '',
    place: typeof transaction.place === 'string' ? transaction.place : '',
    category: typeof transaction.category === 'string' ? transaction.category : '',
    owner: typeof transaction.owner === 'string' ? transaction.owner : '',
    amount: Number.isFinite(transaction.amount) ? (transaction.amount as number) : 0,
    installments: null
  };

  if (transaction.installments && typeof transaction.installments === 'object') {
    const current = Number.parseInt(
      (transaction.installments as { current?: string | number }).current as string,
      10
    );
    const total = Number.parseInt(
      (transaction.installments as { total?: string | number }).total as string,
      10
    );

    if (Number.isFinite(current) && Number.isFinite(total)) {
      sanitized.installments = { current, total };
    }
  }

  return sanitized;
}
