import type { Db } from 'mongodb';
import type { CategoryDocument } from '../controllers/category/categoryDocument';
import type { TransactionsCategorySummaryResponseDto } from '../domain/transactions/transactionDto';
import { getMonthNameFromIsoMonth } from '../utils/statements';

interface CategorySummaryAggregationRow {
  _id?: {
    month?: string;
    category?: string;
  };
  totalAmount?: number;
}

const YEAR_REGEX = /^\d{4}$/;

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

async function loadAvailableYears(db: Db): Promise<string[]> {
  const docs = await db
    .collection('transactions')
    .aggregate<{ _id: string }>([
      derivedFieldsStage,
      resolvedDatePartsStage,
      {
        $match: {
          _resolvedYear: {
            $regex: YEAR_REGEX
          }
        }
      },
      {
        $group: {
          _id: '$_resolvedYear'
        }
      },
      {
        $sort: {
          _id: -1
        }
      }
    ])
    .toArray();

  return docs
    .map((doc) => doc._id)
    .filter((year): year is string => typeof year === 'string' && YEAR_REGEX.test(year));
}

async function loadCategories(db: Db): Promise<Array<{ category: string; name: string }>> {
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

  return rawCategories
    .map((entry) => {
      const category = typeof entry.category === 'string' ? entry.category.trim().toUpperCase() : '';
      const name = typeof entry.name === 'string' ? entry.name.trim() : '';
      if (!category) {
        return null;
      }
      return { category, name: name || category };
    })
    .filter((entry): entry is { category: string; name: string } => Boolean(entry));
}

export async function getTransactionsCategorySummary(
  db: Db,
  requestedYear?: string
): Promise<TransactionsCategorySummaryResponseDto> {
  const [years, categories] = await Promise.all([loadAvailableYears(db), loadCategories(db)]);
  const currentYear = String(new Date().getFullYear());

  let selectedYear = typeof requestedYear === 'string' ? requestedYear.trim() : '';
  if (!selectedYear || !years.includes(selectedYear)) {
    selectedYear = years.includes(currentYear) ? currentYear : years[0] ?? '';
  }

  if (!selectedYear) {
    return {
      summary: [],
      years,
      selectedYear: '',
      categories
    };
  }

  const aggregated = await db
    .collection('transactions')
    .aggregate<CategorySummaryAggregationRow>([
      derivedFieldsStage,
      resolvedDatePartsStage,
      resolvedCompetenceRefStage,
      {
        $match: {
          _resolvedYear: selectedYear,
          _resolvedCompetenceRef: {
            $regex: /^\d{4}-\d{2}$/
          }
        }
      },
      {
        $project: {
          month: '$_resolvedCompetenceRef',
          amount: {
            $cond: [{ $ne: ['$amount', null] }, '$amount', 0]
          },
          transactionKey: {
            $toUpper: {
              $trim: {
                input: { $ifNull: ['$name', ''] }
              }
            }
          },
          transactionCategory: {
            $toUpper: {
              $trim: {
                input: { $ifNull: ['$category', ''] }
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
          effectiveCategory: {
            $let: {
              vars: {
                mappedCategory: {
                  $toUpper: {
                    $trim: {
                      input: {
                        $ifNull: [{ $arrayElemAt: ['$mapping.category', 0] }, '']
                      }
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
            category: '$effectiveCategory'
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

  for (const row of aggregated) {
    const month = typeof row._id?.month === 'string' ? row._id.month.trim() : '';
    const category = typeof row._id?.category === 'string' ? row._id.category.trim().toUpperCase() : '';
    if (!month || !category || !categorySet.has(category)) {
      continue;
    }
    const totalAmount =
      typeof row.totalAmount === 'number' && Number.isFinite(row.totalAmount) ? row.totalAmount : 0;
    totalsByMonthAndCategory.set(`${month}|${category}`, Number.parseFloat(totalAmount.toFixed(2)));
  }

  const monthKeys = Array.from({ length: 12 }, (_, index) => {
    const monthNumber = String(index + 1).padStart(2, '0');
    return `${selectedYear}-${monthNumber}`;
  });

  const summary = monthKeys.map((monthKey) => {
    const totalsByCategory: Record<string, number> = {};
    for (const categoryCode of categoryCodes) {
      totalsByCategory[categoryCode] = totalsByMonthAndCategory.get(`${monthKey}|${categoryCode}`) ?? 0;
    }
    return {
      month: monthKey,
      monthName: getMonthNameFromIsoMonth(monthKey) || 'Unknown',
      totalsByCategory
    };
  });

  return {
    summary,
    years,
    selectedYear,
    categories
  };
}
