import type { Db } from 'mongodb';
import type { TransactionsListResponseDto } from '../domain/transactions/transactionDto';
import { mapTransactionRecordToListItemDto } from '../domain/transactions/transactionMappers';
import type { TransactionRecord } from '../domain/transactions/transactionTypes';
import { getMonthNameFromIsoMonth } from '../utils/statements';

interface TransactionsListAggregationRow {
  _id?: unknown;
  date?: unknown;
  name?: unknown;
  owner?: unknown;
  amount?: unknown;
  installments?: unknown;
  category?: unknown;
  mapping?: Array<{
    _id?: unknown;
    cleanName?: unknown;
    category?: unknown;
    transaction?: unknown;
  }>;
}

const normalizedCompetenceRefExpression = {
  $trim: {
    input: {
      $toString: { $ifNull: ['$competenceRef', ''] }
    }
  }
};

const normalizedCompetenceYearExpression = {
  $trim: {
    input: {
      $toString: { $ifNull: ['$competenceYear', ''] }
    }
  }
};

const normalizedCompetenceMonthExpression = {
  $trim: {
    input: {
      $toString: { $ifNull: ['$competenceMonth', ''] }
    }
  }
};

const derivedFieldsStage = {
  $addFields: {
    _normalizedCompetenceRef: normalizedCompetenceRefExpression,
    _normalizedCompetenceYear: normalizedCompetenceYearExpression,
    _normalizedCompetenceMonth: normalizedCompetenceMonthExpression
  }
};

const resolvedDatePartsStage = {
  $addFields: {
    _resolvedYear: {
      $cond: [
        {
          $regexMatch: {
            input: '$_normalizedCompetenceRef',
            regex: /^\d{4}-\d{2}$/
          }
        },
        { $substrBytes: ['$_normalizedCompetenceRef', 0, 4] },
        {
          $cond: [
            {
              $regexMatch: {
                input: '$_normalizedCompetenceYear',
                regex: /^\d{4}$/
              }
            },
            '$_normalizedCompetenceYear',
            ''
          ]
        }
      ]
    },
    _resolvedMonth: {
      $cond: [
        {
          $regexMatch: {
            input: '$_normalizedCompetenceRef',
            regex: /^\d{4}-\d{2}$/
          }
        },
        { $substrBytes: ['$_normalizedCompetenceRef', 5, 2] },
        {
          $cond: [
            {
              $regexMatch: {
                input: '$_normalizedCompetenceMonth',
                regex: /^\d{1,2}$/
              }
            },
            {
              $let: {
                vars: {
                  monthAsNumber: { $toInt: '$_normalizedCompetenceMonth' }
                },
                in: {
                  $cond: [
                    {
                      $and: [
                        { $gte: ['$$monthAsNumber', 1] },
                        { $lte: ['$$monthAsNumber', 12] }
                      ]
                    },
                    {
                      $cond: [
                        { $lt: ['$$monthAsNumber', 10] },
                        { $concat: ['0', { $toString: '$$monthAsNumber' }] },
                        { $toString: '$$monthAsNumber' }
                      ]
                    },
                    ''
                  ]
                }
              }
            },
            ''
          ]
        }
      ]
    }
  }
};

const resolvedCompetenceRefStage = {
  $addFields: {
    _resolvedCompetenceRef: {
      $cond: [
        {
          $and: [{ $ne: ['$_resolvedYear', ''] }, { $ne: ['$_resolvedMonth', ''] }]
        },
        { $concat: ['$_resolvedYear', '-', '$_resolvedMonth'] },
        ''
      ]
    }
  }
};

export async function getTransactionsListByMonth(
  db: Db,
  month: string
): Promise<TransactionsListResponseDto> {
  const rows = await db
    .collection('transactions')
    .aggregate<TransactionsListAggregationRow>([
      derivedFieldsStage,
      resolvedDatePartsStage,
      resolvedCompetenceRefStage,
      {
        $match: {
          _resolvedCompetenceRef: month
        }
      },
      {
        $project: {
          _id: 1,
          date: 1,
          name: 1,
          owner: 1,
          amount: 1,
          installments: 1,
          category: 1,
          transactionKey: {
            $toUpper: {
              $trim: {
                input: { $ifNull: ['$name', ''] }
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'transaction_mappings',
          let: {
            transactionKey: '$transactionKey'
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
                    '$$transactionKey'
                  ]
                }
              }
            },
            {
              $project: {
                _id: 1,
                cleanName: 1,
                category: 1,
                transaction: 1
              }
            },
            {
              $limit: 1
            }
          ],
          as: 'mapping'
        }
      }
    ])
    .toArray();

  const transactions = rows.map((row) => {
    const mapping = Array.isArray(row.mapping) && row.mapping.length > 0 ? row.mapping[0] : null;
    const parsedInstallments = (() => {
      if (!row.installments || typeof row.installments !== 'object') {
        return null;
      }
      const current = Number.parseInt(
        String((row.installments as { current?: unknown }).current ?? ''),
        10
      );
      const total = Number.parseInt(String((row.installments as { total?: unknown }).total ?? ''), 10);
      if (!Number.isFinite(current) || !Number.isFinite(total)) {
        return null;
      }
      return { current, total };
    })();

    const record: TransactionRecord = {
      date: typeof row.date === 'string' ? row.date : '',
      name: typeof row.name === 'string' ? row.name : '',
      owner: typeof row.owner === 'string' ? row.owner : '',
      amount: typeof row.amount === 'number' && Number.isFinite(row.amount) ? row.amount : 0,
      installments: parsedInstallments,
      category: typeof row.category === 'string' ? row.category : ''
    };

    const mapped = mapTransactionRecordToListItemDto(record, {
      cleanName: typeof mapping?.cleanName === 'string' ? mapping.cleanName : '',
      category: typeof mapping?.category === 'string' ? mapping.category : '',
      mappingId: mapping?._id ? String(mapping._id) : '',
      mappingTransaction: typeof mapping?.transaction === 'string' ? mapping.transaction : ''
    });

    return mapped;
  });

  transactions.sort((a, b) => {
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

  return {
    month,
    monthName: getMonthNameFromIsoMonth(month) || '',
    transactions
  };
}
