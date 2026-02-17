import { Request, Response } from 'express';
import { Db, ObjectId } from 'mongodb';
import type { CsvTransaction } from '../../src/models/csv-transaction';
import {
  resolveStatementMonthName,
  sanitizeTransaction,
  getMonthNameFromIsoMonth
} from '../utils/statements';

interface StatementDocument {
  _id?: ObjectId;
  month?: string;
  fileName?: string;
  monthName?: string;
  totalAmount?: number;
  totalTransactions?: number;
  transactions?: CsvTransaction[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface TransactionMappingDocument {
  _id?: ObjectId;
  transaction?: string;
  cleanName?: string;
  category?: string;
}

interface CategoryDocument {
  _id?: ObjectId;
  name?: string;
  category?: string;
}

interface CategorySummaryAggregateEntry {
  _id?: {
    month?: unknown;
    category?: unknown;
  };
  totalAmount?: unknown;
}

async function loadAvailableYears(db: Db): Promise<string[]> {
  const availableYearsDocs = await db
    .collection<StatementDocument>('statements')
    .aggregate([
      {
        $match: {
          month: { $type: 'string', $regex: /^\d{4}-\d{2}$/ }
        }
      },
      {
        $project: {
          year: { $substrBytes: ['$month', 0, 4] }
        }
      },
      {
        $group: {
          _id: '$year'
        }
      },
      {
        $sort: {
          _id: -1
        }
      }
    ])
    .toArray();

  return availableYearsDocs
    .map((doc) => doc._id)
    .filter((year): year is string => typeof year === 'string' && year.trim().length > 0)
    .map((year) => year.trim());
}

function resolveDb(req: Request): Db {
  const db = req.app.locals.db as Db | undefined;
  if (!db) {
    throw new Error('Database connection is not available in app locals.');
  }
  return db;
}

const normalizeTransactionKey = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  return trimmed ? trimmed.toUpperCase() : '';
};

export async function handleCreateStatement(req: Request, res: Response) {
  const db = resolveDb(req);
  const {
    month = '',
    totalAmount,
    totalTransactions,
    transactions,
    fileName = '',
    monthName: providedMonthName = ''
  } = req.body ?? {};

  if (
    !Array.isArray(transactions) ||
    !Number.isFinite(totalAmount) ||
    !Number.isFinite(totalTransactions)
  ) {
    return res.status(400).json({ error: 'Invalid statement payload.' });
  }

  const sanitizedTransactions = transactions
    .map((transaction) => sanitizeTransaction(transaction))
    .filter((transaction): transaction is CsvTransaction => transaction !== null);

  if (!sanitizedTransactions.length) {
    return res.status(400).json({ error: 'Statement has no transactions to persist.' });
  }

  try {
    const now = new Date();
    const monthName = resolveStatementMonthName(
      month,
      fileName,
      sanitizedTransactions,
      providedMonthName
    );
    const result = await db.collection<StatementDocument>('statements').insertOne({
      month: typeof month === 'string' ? month : '',
      fileName: typeof fileName === 'string' ? fileName : '',
      monthName,
      totalAmount,
      totalTransactions,
      transactions: sanitizedTransactions,
      createdAt: now,
      updatedAt: now
    });

    return res.status(201).json({
      statementId: result.insertedId.toHexString(),
      totalTransactions: sanitizedTransactions.length
    });
  } catch (error) {
    console.error('Failed to persist statement', error);
    return res.status(500).json({ error: 'Failed to persist statement.' });
  }
}

export async function handleGetSummary(req: Request, res: Response) {
  const db = resolveDb(req);
  try {
    const years = await loadAvailableYears(db);

    const requestedYear = typeof req.query.year === 'string' ? req.query.year.trim() : '';
    let targetYear = requestedYear;
    if (!targetYear || !years.includes(targetYear)) {
      targetYear = years[0] ?? '';
    }

    const rawSummary = targetYear
      ? await db
          .collection('statements')
          .aggregate([
            {
              $match: {
                month: { $regex: new RegExp(`^${targetYear}-`) }
              }
            },
            {
              $addFields: {
                installmentBreakdown: {
                  $cond: [
                    { $isArray: '$transactions' },
                    {
                      $reduce: {
                        input: '$transactions',
                        initialValue: { installment: 0, total: 0 },
                        in: {
                          installment: {
                            $add: [
                              '$$value.installment',
                              {
                                $cond: [
                                  {
                                    $and: [
                                      { $ne: ['$$this.installments', null] },
                                      { $ne: ['$$this.installments', undefined] },
                                      { $gt: ['$$this.installments.total', 1] },
                                      { $gt: ['$$this.installments.current', 0] },
                                      { $ne: ['$$this.amount', null] },
                                      { $ne: ['$$this.amount', undefined] }
                                    ]
                                  },
                                  '$$this.amount',
                                  0
                                ]
                              }
                            ]
                          },
                          total: {
                            $add: [
                              '$$value.total',
                              {
                                $cond: [
                                  {
                                    $and: [
                                      { $ne: ['$$this.amount', null] },
                                      { $ne: ['$$this.amount', undefined] }
                                    ]
                                  },
                                  '$$this.amount',
                                  0
                                ]
                              }
                            ]
                          }
                        }
                      }
                    },
                    { installment: 0, total: 0 }
                  ]
                }
              }
            },
            {
              $addFields: {
                installmentAmount: '$installmentBreakdown.installment',
                nonInstallmentAmount: {
                  $max: [
                    0,
                    {
                      $subtract: [
                        '$installmentBreakdown.total',
                        '$installmentBreakdown.installment'
                      ]
                    }
                  ]
                }
              }
            },
            {
              $group: {
                _id: {
                  $cond: [
                    { $or: [{ $eq: ['$month', ''] }, { $not: ['$month'] }] },
                    'Unknown',
                    '$month'
                  ]
                },
                totalAmount: {
                  $sum: {
                    $cond: [
                      { $and: [{ $ne: ['$totalAmount', null] }, { $ne: ['$totalAmount', undefined] }] },
                      '$totalAmount',
                      0
                    ]
                  }
                },
                monthName: { $first: { $ifNull: ['$monthName', ''] } },
                installmentAmount: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $ne: ['$installmentAmount', null] },
                          { $ne: ['$installmentAmount', undefined] }
                        ]
                      },
                      '$installmentAmount',
                      0
                    ]
                  }
                },
                nonInstallmentAmount: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $ne: ['$nonInstallmentAmount', null] },
                          { $ne: ['$nonInstallmentAmount', undefined] }
                        ]
                      },
                      '$nonInstallmentAmount',
                      0
                    ]
                  }
                }
              }
            },
            { $sort: { _id: 1 } }
          ])
          .toArray()
      : [];

    const normalizedSummary = rawSummary
      .filter((entry) => entry && typeof entry._id === 'string' && entry._id)
      .map((entry) => {
        const monthValue = typeof entry._id === 'string' && entry._id ? entry._id : 'Unknown';
        const amount =
          typeof entry.totalAmount === 'number' && Number.isFinite(entry.totalAmount)
            ? entry.totalAmount
            : 0;
        const installmentAmount =
          typeof entry.installmentAmount === 'number' && Number.isFinite(entry.installmentAmount)
            ? entry.installmentAmount
            : 0;
        const nonInstallmentAmount =
          typeof entry.nonInstallmentAmount === 'number' &&
          Number.isFinite(entry.nonInstallmentAmount)
            ? entry.nonInstallmentAmount
            : 0;
        const derivedName =
          typeof entry.monthName === 'string' && entry.monthName
            ? entry.monthName
            : getMonthNameFromIsoMonth(monthValue);

        return {
          month: monthValue,
          monthName: derivedName || 'Unknown',
          totalAmount: Number.parseFloat(amount.toFixed(2)),
          installmentAmount: Number.parseFloat(installmentAmount.toFixed(2)),
          nonInstallmentAmount: Number.parseFloat(nonInstallmentAmount.toFixed(2))
        };
      });

    let summary = normalizedSummary;
    const hasValidYear = typeof targetYear === 'string' && /^\d{4}$/.test(targetYear);
    if (hasValidYear) {
      const monthKeys = Array.from({ length: 12 }, (_, index) => {
        const monthNumber = String(index + 1).padStart(2, '0');
        return `${targetYear}-${monthNumber}`;
      });
      const monthKeySet = new Set(monthKeys);
      const summaryByMonth = new Map(summary.map((entry) => [entry.month, entry]));

      const paddedSummary = monthKeys.map((monthKey) => {
        const existing = summaryByMonth.get(monthKey);
        if (existing) {
          return existing;
        }
        const derivedName = getMonthNameFromIsoMonth(monthKey) || 'Unknown';
        return {
          month: monthKey,
          monthName: derivedName,
          totalAmount: 0,
          installmentAmount: 0,
          nonInstallmentAmount: 0
        };
      });

      const unmatchedEntries = summary.filter((entry) => !monthKeySet.has(entry.month));
      summary = [...paddedSummary, ...unmatchedEntries];
    }

    res.status(200).json({
      summary,
      years,
      selectedYear: targetYear
    });
  } catch (error) {
    console.error('Failed to load statement summary', error);
    res.status(500).json({ error: 'Failed to load statement summary.' });
  }
}

export async function handleGetCategorySummary(req: Request, res: Response) {
  const db = resolveDb(req);

  try {
    const years = await loadAvailableYears(db);
    const requestedYear = typeof req.query.year === 'string' ? req.query.year.trim() : '';
    let targetYear = requestedYear;
    if (!targetYear || !years.includes(targetYear)) {
      targetYear = years[0] ?? '';
    }

    const rawCategories = await db
      .collection<CategoryDocument>('categories')
      .find(
        {},
        {
          projection: {
            name: 1,
            category: 1
          }
        }
      )
      .sort({ name: 1 })
      .toArray();

    const categories = rawCategories
      .map((entry) => {
        const category =
          typeof entry.category === 'string' ? entry.category.trim().toUpperCase() : '';
        const name = typeof entry.name === 'string' ? entry.name.trim() : '';
        if (!category) {
          return null;
        }
        return {
          category,
          name: name || category
        };
      })
      .filter((entry): entry is { category: string; name: string } => Boolean(entry));

    if (!targetYear) {
      return res.status(200).json({
        summary: [],
        years,
        selectedYear: '',
        categories
      });
    }

    const aggregated = await db
      .collection('statements')
      .aggregate<CategorySummaryAggregateEntry>([
        {
          $match: {
            month: { $regex: new RegExp(`^${targetYear}-\\d{2}$`) }
          }
        },
        {
          $project: {
            month: 1,
            transactions: 1
          }
        },
        {
          $unwind: {
            path: '$transactions',
            preserveNullAndEmptyArrays: false
          }
        },
        {
          $project: {
            month: 1,
            placeKey: {
              $toUpper: {
                $trim: {
                  input: { $ifNull: ['$transactions.name', ''] }
                }
              }
            },
            transactionCategory: {
              $toUpper: {
                $trim: {
                  input: { $ifNull: ['$transactions.category', ''] }
                }
              }
            },
            amount: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$transactions.amount', null] },
                    { $ne: ['$transactions.amount', undefined] }
                  ]
                },
                '$transactions.amount',
                0
              ]
            }
          }
        },
        {
          $lookup: {
            from: 'transaction_mappings',
            let: {
              placeKey: '$placeKey'
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [
                      {
                        $toUpper: {
                          $trim: {
                            input: { $ifNull: ['$transaction', ''] }
                          }
                        }
                      },
                      '$$placeKey'
                    ]
                  }
                }
              },
              {
                $project: {
                  _id: 0,
                  category: 1
                }
              },
              {
                $limit: 1
              }
            ],
            as: 'mapping'
          }
        },
        {
          $addFields: {
            category: {
              $let: {
                vars: {
                  mappedCategory: {
                      $trim: {
                        input: {
                          $ifNull: [{ $arrayElemAt: ['$mapping.category', 0] }, '']
                        }
                      }
                  }
                },
                in: {
                  $cond: [
                    { $ne: ['$$mappedCategory', ''] },
                    '$$mappedCategory',
                    '$transactionCategory'
                  ]
                }
              }
            }
          }
        },
        {
          $group: {
            _id: {
              month: '$month',
              category: '$category'
            },
            totalAmount: {
              $sum: '$amount'
            }
          }
        }
      ])
      .toArray();

    const categoryCodes = categories.map((entry) => entry.category);
    const categorySet = new Set(categoryCodes);
    const totalsByMonthAndCategory = new Map<string, number>();

    for (const entry of aggregated) {
      const month =
        typeof entry._id?.month === 'string' ? entry._id.month.trim() : '';
      const category =
        typeof entry._id?.category === 'string' ? entry._id.category.trim().toUpperCase() : '';
      if (!month || !categorySet.has(category)) {
        continue;
      }
      const totalAmount =
        typeof entry.totalAmount === 'number' && Number.isFinite(entry.totalAmount)
          ? entry.totalAmount
          : 0;
      totalsByMonthAndCategory.set(
        `${month}|${category}`,
        Number.parseFloat(totalAmount.toFixed(2))
      );
    }

    const monthKeys = Array.from({ length: 12 }, (_, index) => {
      const monthNumber = String(index + 1).padStart(2, '0');
      return `${targetYear}-${monthNumber}`;
    });

    const summary = monthKeys.map((monthKey) => {
      const totals: Record<string, number> = {};
      categoryCodes.forEach((categoryCode) => {
        const key = `${monthKey}|${categoryCode}`;
        totals[categoryCode] = totalsByMonthAndCategory.get(key) ?? 0;
      });

      return {
        month: monthKey,
        monthName: getMonthNameFromIsoMonth(monthKey) || 'Unknown',
        totalsByCategory: totals
      };
    });

    return res.status(200).json({
      summary,
      years,
      selectedYear: targetYear,
      categories
    });
  } catch (error) {
    console.error('Failed to load statement category summary', error);
    return res.status(500).json({ error: 'Failed to load statement category summary.' });
  }
}

export async function handleGetTransactions(req: Request, res: Response) {
  const db = resolveDb(req);
  const rawMonth = typeof req.query.month === 'string' ? req.query.month.trim() : '';

  if (!rawMonth) {
    return res.status(400).json({ error: 'Month query parameter is required.' });
  }

  const isUnknownMonth = rawMonth.toLowerCase() === 'unknown';
  const monthQuery = isUnknownMonth
    ? {
        $or: [
          { month: { $in: ['', null] } },
          { month: { $exists: false } }
        ]
      }
    : { month: rawMonth };

  try {
    const statements = await db
      .collection<StatementDocument>('statements')
      .find(monthQuery, {
        projection: {
          transactions: 1,
          monthName: 1,
          fileName: 1,
          month: 1,
          _id: 1
        }
      })
      .toArray();

    if (!statements.length) {
      return res.status(200).json({
        month: rawMonth,
        monthName: isUnknownMonth ? 'Unknown' : getMonthNameFromIsoMonth(rawMonth) || '',
        transactions: []
      });
    }

    const transactions: Array<CsvTransaction & {
      statementId: string;
      fileName: string;
      cleanName?: string;
      mappingId?: string;
      mappingTransaction?: string;
    }> = [];
    const uniquePlaces = new Set<string>();
    for (const statement of statements) {
      const statementTransactions = Array.isArray(statement.transactions)
        ? statement.transactions
        : [];
      for (const transaction of statementTransactions) {
        if (!transaction || typeof transaction !== 'object') {
          continue;
        }
        const normalized = sanitizeTransaction(transaction);
        if (normalized) {
          const placeValue = typeof normalized.place === 'string' ? normalized.place : '';
          if (placeValue) {
            uniquePlaces.add(placeValue);
          }
          transactions.push({
            ...normalized,
            statementId: statement._id ? String(statement._id) : '',
            fileName: typeof statement.fileName === 'string' ? statement.fileName : ''
          });
        }
      }
    }

    let mappingDocs: TransactionMappingDocument[] = [];
    if (uniquePlaces.size) {
      mappingDocs = await db
        .collection<TransactionMappingDocument>('transaction_mappings')
        .find(
          { transaction: { $in: Array.from(uniquePlaces) } },
          { projection: { transaction: 1, cleanName: 1, category: 1, _id: 1 } }
        )
        .toArray();
    }

    const mappingByKey = new Map<
      string,
      { id: string; cleanName: string; category: string; transaction: string }
    >();
    for (const doc of mappingDocs) {
      const key = normalizeTransactionKey(doc.transaction);
      if (!key) {
        continue;
      }
      mappingByKey.set(key, {
        id: doc._id ? String(doc._id) : '',
        cleanName: typeof doc.cleanName === 'string' ? doc.cleanName : '',
        category: typeof doc.category === 'string' ? doc.category : '',
        transaction: typeof doc.transaction === 'string' ? doc.transaction : ''
      });
    }

    const enrichedTransactions = transactions.map((transaction) => {
      const lookupKey = normalizeTransactionKey(transaction.place);
      const mapping = lookupKey ? mappingByKey.get(lookupKey) : null;
      const mappedCategory =
        typeof mapping?.category === 'string' ? mapping.category.trim() : '';
      const cleanNameValue =
        typeof mapping?.cleanName === 'string' ? mapping.cleanName.trim() : '';

      return {
        ...transaction,
        cleanName: cleanNameValue,
        category:
          mappedCategory || (typeof transaction.category === 'string' ? transaction.category : ''),
        mappingId: mapping?.id || '',
        mappingTransaction:
          mapping?.transaction || (typeof transaction.place === 'string' ? transaction.place : '')
      };
    });

    enrichedTransactions.sort((a, b) => {
      const aDate = Date.parse(a.date);
      const bDate = Date.parse(b.date);
      if (Number.isNaN(aDate) && Number.isNaN(bDate)) {
        return 0;
      }
      if (Number.isNaN(aDate)) {
        return 1;
      }
      if (Number.isNaN(bDate)) {
        return -1;
      }
      return bDate - aDate;
    });

    const monthNameFromStatements = statements.find(
      (statement) => typeof statement.monthName === 'string' && statement.monthName.trim()
    );

    const resolvedMonthName =
      (monthNameFromStatements ? monthNameFromStatements.monthName?.trim() : '') ||
      (isUnknownMonth ? 'Unknown' : getMonthNameFromIsoMonth(rawMonth)) ||
      '';

    res.status(200).json({
      month: isUnknownMonth ? '' : rawMonth,
      monthName: resolvedMonthName,
      transactions: enrichedTransactions
    });
  } catch (error) {
    console.error('Failed to load transactions', error);
    res.status(500).json({ error: 'Failed to load transactions.' });
  }
}
