import { Db } from 'mongodb';
import type { TransactionRecord } from '../domain/transactions/transactionTypes';
import { MONTH_PATTERN } from '../utils/validation';

export class TransactionImportValidationError extends Error {}

interface CsvTransactionPayload {
  date?: unknown;
  name?: unknown;
  owner?: unknown;
  amount?: unknown;
  installments?: unknown;
}

function resolveCompetenceRef(
  providedMonth: unknown,
  transactions: CsvTransactionPayload[]
): string {
  const month = typeof providedMonth === 'string' ? providedMonth.trim() : '';
  if (MONTH_PATTERN.test(month)) {
    return month;
  }

  for (const transaction of transactions) {
    const date = typeof transaction.date === 'string' ? transaction.date.trim() : '';
    const match = date.match(/^(\d{4}-\d{2})-\d{2}$/);
    if (match && MONTH_PATTERN.test(match[1])) {
      return match[1];
    }
  }

  return '';
}

function normalizeInstallments(value: unknown): { current: number; total: number } | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const current = Number.parseInt(String((value as { current?: unknown }).current ?? ''), 10);
  const total = Number.parseInt(String((value as { total?: unknown }).total ?? ''), 10);
  if (!Number.isInteger(current) || !Number.isInteger(total)) {
    return null;
  }
  return { current, total };
}

export async function importTransactionsFromStatementPayload(
  db: Db,
  payload: {
    month?: unknown;
    fileName?: unknown;
    transactions?: unknown;
  }
): Promise<{ statementId: string; totalTransactions: number; replacedExisting: boolean }> {
  const rawTransactions = Array.isArray(payload.transactions) ? payload.transactions : [];
  if (!rawTransactions.length) {
    throw new TransactionImportValidationError('Statement has no transactions to persist.');
  }

  const transactions = rawTransactions.filter(
    (entry): entry is CsvTransactionPayload => Boolean(entry && typeof entry === 'object')
  );
  if (!transactions.length) {
    throw new TransactionImportValidationError('Invalid statement payload.');
  }

  const competenceRef = resolveCompetenceRef(payload.month, transactions);
  if (!MONTH_PATTERN.test(competenceRef)) {
    throw new TransactionImportValidationError('Month must match YYYY-MM.');
  }
  const competenceYear = competenceRef.slice(0, 4);
  const competenceMonth = competenceRef.slice(5, 7);
  const sourceFileName = typeof payload.fileName === 'string' ? payload.fileName.trim() : '';

  const now = new Date();
  const importBatchId = `${now.getTime().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
  const records: TransactionRecord[] = transactions.map((entry) => {
    const amount = Number(entry.amount);
    if (!Number.isFinite(amount)) {
      throw new TransactionImportValidationError('Amount must be a finite number.');
    }

    return {
      competenceRef,
      competenceYear,
      competenceMonth,
      date: typeof entry.date === 'string' ? entry.date : '',
      name: typeof entry.name === 'string' ? entry.name : '',
      owner: typeof entry.owner === 'string' ? entry.owner : '',
      amount,
      installments: normalizeInstallments(entry.installments),
      paymentMethod: '',
      createdAt: now,
      updatedAt: now,
      sourceFileName,
      importBatchId
    };
  });

  let replacedExisting = false;
  if (sourceFileName) {
    const deletion = await db.collection('transactions').deleteMany({ sourceFileName });
    replacedExisting = deletion.deletedCount > 0;
  }

  const result = await db.collection<TransactionRecord>('transactions').insertMany(records);

  return {
    statementId: importBatchId,
    totalTransactions: result.insertedCount,
    replacedExisting
  };
}
