import { Request, Response } from 'express';
import { Db } from 'mongodb';
import { getTransactionsSummary } from '../../services/transactionsSummaryService';
import { getTransactionsCategorySummary } from '../../services/transactionsCategorySummaryService';
import { getTransactionsListByMonth } from '../../services/transactionsListService';
import {
  importTransactionsFromStatementPayload,
  TransactionImportValidationError
} from '../../services/transactionImportService';
import {
  createTransactionMapping,
  MappingConflictError,
  MappingNotFoundError,
  MappingValidationError,
  upsertTransactionMappingByTransaction,
  updateTransactionMapping
} from '../../services/transactionMappingService';
import {
  normalizeMonthQuery,
  normalizeYearQuery,
  validateMonthQuery,
  validateYearQuery
} from '../../utils/validation';

function resolveDb(req: Request): Db {
  const db = req.app.locals.db as Db | undefined;
  if (!db) {
    throw new Error('Database connection is not available in app locals.');
  }
  return db;
}

export async function handleUpdateSingleTransactionCategory(req: Request, res: Response) {
  const db = resolveDb(req);
  const idValue = typeof req.body?.id === 'string' ? req.body.id.trim() : '';
  const transactionValue = req.body?.transaction;
  const categoryValue = req.body?.category;
  const cleanNameValue = req.body?.cleanName;

  try {
    const mapping = idValue
      ? await updateTransactionMapping(db, idValue, {
          category: categoryValue,
          cleanName: cleanNameValue
        })
      : await upsertTransactionMappingByTransaction(db, {
          transaction: transactionValue,
          category: categoryValue,
          cleanName: cleanNameValue
        });

    return res.status(200).json({ mapping, place: mapping, name: mapping });
  } catch (error) {
    if (error instanceof MappingValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof MappingNotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Failed to update single place category', error);
    return res.status(500).json({ error: 'Failed to update place category.' });
  }
}

export async function handleCreateTransactionMapping(req: Request, res: Response) {
  const db = resolveDb(req);

  try {
    const mapping = await createTransactionMapping(db, {
      transaction: req.body?.transaction,
      category: req.body?.category,
      cleanName: req.body?.cleanName
    });
    return res.status(201).json({ mapping });
  } catch (error) {
    if (error instanceof MappingValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof MappingConflictError) {
      return res.status(409).json({ error: error.message });
    }
    console.error('Failed to create transaction mapping', error);
    return res.status(500).json({ error: 'Failed to create transaction mapping.' });
  }
}

export async function handleUpdateTransactionMapping(req: Request, res: Response) {
  const db = resolveDb(req);
  const mappingId = typeof req.params.id === 'string' ? req.params.id : '';

  try {
    const mapping = await updateTransactionMapping(db, mappingId, {
      category: req.body?.category,
      cleanName: req.body?.cleanName
    });
    return res.status(200).json({ mapping });
  } catch (error) {
    if (error instanceof MappingValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof MappingNotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Failed to update transaction mapping', error);
    return res.status(500).json({ error: 'Failed to update transaction mapping.' });
  }
}

export async function handleGetTransactionsSummary(req: Request, res: Response) {
  const db = resolveDb(req);
  const requestedYear = normalizeYearQuery(req.query.year);
  const yearValidationError = validateYearQuery(requestedYear);
  if (yearValidationError) {
    return res.status(400).json({ error: yearValidationError });
  }

  try {
    const payload = await getTransactionsSummary(db, requestedYear);
    return res.status(200).json(payload);
  } catch (error) {
    console.error('Failed to load transactions summary', error);
    return res.status(500).json({ error: 'Failed to load transactions summary.' });
  }
}

export async function handleGetTransactionsCategorySummary(req: Request, res: Response) {
  const db = resolveDb(req);
  const requestedYear = normalizeYearQuery(req.query.year);
  const yearValidationError = validateYearQuery(requestedYear);
  if (yearValidationError) {
    return res.status(400).json({ error: yearValidationError });
  }

  try {
    const payload = await getTransactionsCategorySummary(db, requestedYear);
    return res.status(200).json(payload);
  } catch (error) {
    console.error('Failed to load transactions category summary', error);
    return res.status(500).json({ error: 'Failed to load transactions category summary.' });
  }
}

export async function handleGetTransactionsByMonth(req: Request, res: Response) {
  const db = resolveDb(req);
  const month = normalizeMonthQuery(req.query.month);
  const monthValidationError = validateMonthQuery(month);
  if (monthValidationError) {
    return res.status(400).json({ error: monthValidationError });
  }

  try {
    const payload = await getTransactionsListByMonth(db, month);
    return res.status(200).json(payload);
  } catch (error) {
    console.error('Failed to load transactions list', error);
    return res.status(500).json({ error: 'Failed to load transactions list.' });
  }
}

export async function handleImportTransactions(req: Request, res: Response) {
  const db = resolveDb(req);
  try {
    const imported = await importTransactionsFromStatementPayload(db, {
      month: req.body?.month,
      fileName: req.body?.fileName,
      transactions: req.body?.transactions
    });
    return res.status(201).json(imported);
  } catch (error) {
    if (error instanceof TransactionImportValidationError) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Failed to import transactions', error);
    return res.status(500).json({ error: 'Failed to import transactions.' });
  }
}
