import type { TransactionListItemDto, TransactionMappingDto } from './transactionDto';
import type { TransactionMappingRecord, TransactionRecord } from './transactionTypes';

export function normalizeTransactionKey(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  return trimmed ? trimmed.toUpperCase() : '';
}

export function mapTransactionMappingRecordToDto(
  record?: TransactionMappingRecord | null
): TransactionMappingDto | null {
  if (!record || typeof record !== 'object') {
    return null;
  }

  const id = record._id ? String(record._id) : '';
  if (!id) {
    return null;
  }

  const cleanNameValue = typeof record.cleanName === 'string' ? record.cleanName.trim() : '';
  const textValue = typeof record.text === 'string' ? record.text.trim() : '';
  const transactionValue =
    typeof record.transaction === 'string' ? record.transaction.trim() : '';
  const sourcePlaceValue =
    typeof record.sourcePlace === 'string' ? record.sourcePlace.trim() : '';
  const updatedAt = record.updatedAt ? new Date(record.updatedAt) : null;

  return {
    id,
    cleanName: cleanNameValue || textValue,
    transaction: transactionValue || sourcePlaceValue,
    category: typeof record.category === 'string' ? record.category : '',
    updatedAt: updatedAt ? updatedAt.toISOString() : ''
  };
}

export function mapTransactionRecordToListItemDto(
  record: TransactionRecord,
  mapping?: {
    cleanName?: string;
    category?: string;
    mappingId?: string;
    mappingTransaction?: string;
  }
): TransactionListItemDto {
  const fallbackName = typeof record.name === 'string' ? record.name : '';
  const amountValue =
    typeof record.amount === 'number' && Number.isFinite(record.amount) ? record.amount : 0;

  return {
    date: typeof record.date === 'string' ? record.date : '',
    name: fallbackName,
    owner: typeof record.owner === 'string' ? record.owner : '',
    amount: Number.parseFloat(amountValue.toFixed(2)),
    installments:
      record.installments && typeof record.installments === 'object'
        ? {
            current:
              typeof record.installments.current === 'number' &&
              Number.isFinite(record.installments.current)
                ? record.installments.current
                : 0,
            total:
              typeof record.installments.total === 'number' &&
              Number.isFinite(record.installments.total)
                ? record.installments.total
                : 0
          }
        : null,
    category:
      typeof mapping?.category === 'string' && mapping.category.trim()
        ? mapping.category.trim()
        : typeof record.category === 'string'
          ? record.category
          : '',
    cleanName: typeof mapping?.cleanName === 'string' ? mapping.cleanName.trim() : '',
    mappingId: typeof mapping?.mappingId === 'string' ? mapping.mappingId : '',
    mappingTransaction:
      typeof mapping?.mappingTransaction === 'string' && mapping.mappingTransaction.trim()
        ? mapping.mappingTransaction
        : fallbackName
  };
}
