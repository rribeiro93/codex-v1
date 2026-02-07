import { CsvTransaction } from '../models/csv-transaction';
import { InstallmentDetails } from '../models/installment-details';
import { MONTH_NAMES } from '../models/month-names';

function formatDateParts(year: number, month: number, day: number): string {
  const yyyy = String(year).padStart(4, '0');
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeDateCell(value: unknown): string {
  if ((!value && value !== 0) || value === null) {
    return '';
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDateParts(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const fromNumber = new Date(value);
    if (!Number.isNaN(fromNumber.getTime())) {
      return formatDateParts(
        fromNumber.getUTCFullYear(),
        fromNumber.getUTCMonth() + 1,
        fromNumber.getUTCDate()
      );
    }
  }

  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const match = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!match) {
    return '';
  }

  const day = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  let year = Number.parseInt(match[3], 10);

  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return '';
  }

  if (year < 100) {
    year += 2000;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return '';
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return '';
  }

  return formatDateParts(year, month, day);
}

function parseAmountCell(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return 0;
  }

  const normalized = value.trim().replace(/[^\d,.-]/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatOwnerName(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  return trimmed
    .split(/\s+/)
    .map((word) => `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(' ');
}

function normalizeInstallmentsField(value: unknown): InstallmentDetails | null {
  if (value == null) {
    return null;
  }

  if (typeof value === 'object') {
    const maybeCurrent = Number.parseInt((value as { current?: string }).current ?? '', 10);
    const maybeTotal = Number.parseInt((value as { total?: string }).total ?? '', 10);

    if (Number.isFinite(maybeCurrent) && Number.isFinite(maybeTotal)) {
      return {
        current: maybeCurrent,
        total: maybeTotal
      };
    }
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === '-') {
    return null;
  }

  const match = trimmed.match(/^(\d+)\s*(?:de|\/)\s*(\d+)$/i);
  if (!match) {
    return null;
  }

  const current = Number.parseInt(match[1], 10);
  const total = Number.parseInt(match[2], 10);

  if (!Number.isFinite(current) || !Number.isFinite(total)) {
    return null;
  }

  return { current, total };
}

export function mapCsvRowToTransaction(row: unknown[] = []): CsvTransaction {
  const originalDate = row[0];
  const originalPlace = row[1] ?? '';
  const originalOwner = row[2];
  const originalAmount = row[3];
  const originalInstallments = row[4] ?? '';

  return {
    date: normalizeDateCell(originalDate),
    place: typeof originalPlace === 'string' ? originalPlace : '',
    category: '',
    owner: formatOwnerName(originalOwner),
    amount: parseAmountCell(originalAmount),
    installments: normalizeInstallmentsField(originalInstallments)
  };
}

export function extractStatementMonth(fileName: string): string {
  if (typeof fileName !== 'string') {
    return '';
  }

  const match = fileName.match(/Fatura(\d{4}-\d{2})-\d{2}\.csv$/i);
  if (!match) {
    return '';
  }

  return match[1];
}

export function filterNonNegativeTransactions(transactions: CsvTransaction[]): CsvTransaction[] {
  return transactions.filter((transaction) => transaction.amount >= 0);
}

export function summarizeTransactions(transactions: CsvTransaction[]): {
  totalAmount: number;
  totalTransactions: number;
} {
  const totalTransactions = transactions.length;
  const rawAmount = transactions.reduce((sum, transaction) => {
    const amount = Number.isFinite(transaction.amount) ? transaction.amount : 0;
    return sum + amount;
  }, 0);

  const totalAmount = Number.parseFloat(rawAmount.toFixed(2));

  return {
    totalAmount,
    totalTransactions
  };
}

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

function extractIsoMonthFromTransactions(transactions: CsvTransaction[] = []): string {
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

export function resolveStatementMonthName({
  month,
  fileName,
  transactions
}: {
  month?: string;
  fileName?: string;
  transactions: CsvTransaction[];
}): string {
  const trimmedMonth = typeof month === 'string' ? month.trim() : '';
  const trimmedFileName = typeof fileName === 'string' ? fileName.trim() : '';

  const candidates = [
    trimmedMonth,
    extractStatementMonth(trimmedFileName),
    extractIsoMonthFromTransactions(transactions)
  ].filter(Boolean);

  for (const isoMonth of candidates) {
    const name = getMonthNameFromIsoMonth(isoMonth);
    if (name) {
      return name;
    }
  }

  return '';
}
