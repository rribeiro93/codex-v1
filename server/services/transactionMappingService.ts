import { Db, ObjectId } from 'mongodb';
import type { TransactionMappingDto } from '../domain/transactions/transactionDto';
import { mapTransactionMappingRecordToDto } from '../domain/transactions/transactionMappers';
import type { TransactionMappingRecord } from '../domain/transactions/transactionTypes';

export class MappingValidationError extends Error {}
export class MappingNotFoundError extends Error {}
export class MappingConflictError extends Error {}

interface MappingChanges {
  category?: string;
  cleanName?: string;
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  return value.trim();
}

function parseChanges(input: {
  category?: unknown;
  cleanName?: unknown;
}): MappingChanges {
  const category = normalizeOptionalString(input.category);
  const cleanName = normalizeOptionalString(input.cleanName);

  const hasCategory = typeof input.category !== 'undefined';
  const hasCleanName = typeof input.cleanName !== 'undefined';
  if (!hasCategory && !hasCleanName) {
    throw new MappingValidationError('At least one of cleanName or category must be provided.');
  }

  const changes: MappingChanges = {};
  if (hasCategory) {
    changes.category = category ?? '';
  }
  if (hasCleanName) {
    changes.cleanName = cleanName ?? '';
  }

  return changes;
}

async function toMappingDto(document: TransactionMappingRecord | null): Promise<TransactionMappingDto> {
  const mapped = mapTransactionMappingRecordToDto(document);
  if (!mapped) {
    throw new Error('Failed to normalize mapping payload.');
  }
  return mapped;
}

export async function createTransactionMapping(
  db: Db,
  payload: {
    transaction?: unknown;
    category?: unknown;
    cleanName?: unknown;
  },
  options?: {
    allowUpdateIfExists?: boolean;
  }
): Promise<TransactionMappingDto> {
  const transaction = normalizeOptionalString(payload.transaction) ?? '';
  if (!transaction) {
    throw new MappingValidationError('Transaction text is required.');
  }

  const changes = parseChanges(payload);
  const now = new Date();
  const collection = db.collection<TransactionMappingRecord>('transaction_mappings');
  const existing = await collection.findOne({ transaction });
  const allowUpdateIfExists = Boolean(options?.allowUpdateIfExists);

  if (existing && !allowUpdateIfExists) {
    throw new MappingConflictError('A mapping for this transaction already exists.');
  }

  let doc: TransactionMappingRecord | null = null;
  if (existing) {
    doc = await collection.findOneAndUpdate(
      { _id: existing._id },
      {
        $set: {
          ...changes,
          updatedAt: now
        }
      },
      { returnDocument: 'after' }
    );
  } else {
    const result = await collection.insertOne({
      transaction,
      sourcePlace: transaction,
      text: '',
      cleanName: changes.cleanName ?? '',
      category: changes.category ?? '',
      createdAt: now,
      updatedAt: now
    });
    doc = await collection.findOne({ _id: result.insertedId });
  }

  if (!doc) {
    doc = await collection.findOne({ transaction });
  }

  return toMappingDto(doc);
}

export async function upsertTransactionMappingByTransaction(
  db: Db,
  payload: {
    transaction?: unknown;
    category?: unknown;
    cleanName?: unknown;
  }
): Promise<TransactionMappingDto> {
  return createTransactionMapping(
    db,
    payload,
    {
      allowUpdateIfExists: true
    }
  );
}

export async function updateTransactionMapping(
  db: Db,
  id: string,
  payload: {
    category?: unknown;
    cleanName?: unknown;
  }
): Promise<TransactionMappingDto> {
  const normalizedId = normalizeOptionalString(id) ?? '';
  if (!normalizedId) {
    throw new MappingValidationError('Mapping id is required.');
  }

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(normalizedId);
  } catch (error) {
    throw new MappingValidationError('Invalid mapping id.');
  }

  const changes = parseChanges(payload);
  const collection = db.collection<TransactionMappingRecord>('transaction_mappings');
  const doc = await collection.findOneAndUpdate(
    { _id: objectId },
    {
      $set: {
        ...changes,
        updatedAt: new Date()
      },
    },
    { returnDocument: 'after' }
  );

  if (!doc) {
    throw new MappingNotFoundError('Mapping not found.');
  }

  return toMappingDto(doc);
}
