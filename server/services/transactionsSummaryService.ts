import type { Db } from 'mongodb';
import type {
  TransactionSummaryMonthDto,
  TransactionsSummaryResponseDto
} from '../domain/transactions/transactionDto';
import { getMonthNameFromIsoMonth } from '../utils/statements';

interface SummaryAggregationRow {
  _id: string;
  totalAmount: number;
  installmentAmount: number;
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

function zeroFillSummaryByYear(year: string, rows: TransactionSummaryMonthDto[]): TransactionSummaryMonthDto[] {
  const byMonth = new Map(rows.map((entry) => [entry.month, entry]));

  return Array.from({ length: 12 }, (_, index) => {
    const monthNumber = String(index + 1).padStart(2, '0');
    const month = `${year}-${monthNumber}`;
    const existing = byMonth.get(month);
    if (existing) {
      return existing;
    }

    return {
      month,
      monthName: getMonthNameFromIsoMonth(month) || 'Unknown',
      totalAmount: 0,
      installmentAmount: 0,
      nonInstallmentAmount: 0
    };
  });
}

export async function getTransactionsSummary(
  db: Db,
  requestedYear?: string
): Promise<TransactionsSummaryResponseDto> {
  const years = await loadAvailableYears(db);
  const currentYear = String(new Date().getFullYear());

  let selectedYear = typeof requestedYear === 'string' ? requestedYear.trim() : '';
  if (!selectedYear || !years.includes(selectedYear)) {
    selectedYear = years.includes(currentYear) ? currentYear : years[0] ?? '';
  }

  if (!selectedYear) {
    return {
      summary: [],
      years,
      selectedYear: ''
    };
  }

  const rows = await db
    .collection('transactions')
    .aggregate<SummaryAggregationRow>([
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
        $group: {
          _id: '$_resolvedCompetenceRef',
          totalAmount: {
            $sum: {
              $cond: [{ $ne: ['$amount', null] }, '$amount', 0]
            }
          },
          installmentAmount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ['$installments.total', 1] },
                    { $gt: ['$installments.current', 0] },
                    { $ne: ['$amount', null] }
                  ]
                },
                '$amount',
                0
              ]
            }
          }
        }
      },
      {
        $sort: {
          _id: 1
        }
      }
    ])
    .toArray();

  const summary = rows.map((row) => {
    const totalAmount = Number.isFinite(row.totalAmount) ? row.totalAmount : 0;
    const installmentAmount = Number.isFinite(row.installmentAmount) ? row.installmentAmount : 0;
    const nonInstallmentAmount = totalAmount - installmentAmount;

    return {
      month: row._id,
      monthName: getMonthNameFromIsoMonth(row._id) || 'Unknown',
      totalAmount: Number.parseFloat(totalAmount.toFixed(2)),
      installmentAmount: Number.parseFloat(installmentAmount.toFixed(2)),
      nonInstallmentAmount: Number.parseFloat(nonInstallmentAmount.toFixed(2))
    };
  });

  return {
    summary: zeroFillSummaryByYear(selectedYear, summary),
    years,
    selectedYear
  };
}
