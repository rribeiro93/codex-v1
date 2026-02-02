const {
  resolveStatementMonthName,
  sanitizeTransaction,
  getMonthNameFromIsoMonth
} = require('../utils/statements');

const normalizeTransactionKey = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  return trimmed ? trimmed.toUpperCase() : '';
};

async function handleCreateStatement(req, res) {
  const db = req.app.locals.db;
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
    .map(sanitizeTransaction)
    .filter((transaction) => transaction !== null);

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
    const result = await db.collection('statements').insertOne({
      month: typeof month === 'string' ? month : '',
      fileName: typeof fileName === 'string' ? fileName : '',
      monthName,
      totalAmount,
      totalTransactions,
      transactions: sanitizedTransactions,
      createdAt: now,
      updatedAt: now
    });

    return res
      .status(201)
      .json({
        statementId: result.insertedId.toHexString(),
        totalTransactions: sanitizedTransactions.length
      });
  } catch (error) {
    console.error('Failed to persist statement', error);
    return res.status(500).json({ error: 'Failed to persist statement.' });
  }
}

async function handleGetSummary(req, res) {
  const db = req.app.locals.db;
  try {
    const availableYearsDocs = await db
      .collection('statements')
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

    const years = availableYearsDocs
      .map((doc) => doc._id)
      .filter((year) => typeof year === 'string' && year.trim())
      .map((year) => year.trim());

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

async function handleGetTransactions(req, res) {
  const db = req.app.locals.db;
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
      .collection('statements')
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

    const transactions = [];
    const uniquePlaces = new Set();
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

    let mappingDocs = [];
    if (uniquePlaces.size) {
      mappingDocs = await db
        .collection('transaction_mappings')
        .find(
          { transaction: { $in: Array.from(uniquePlaces) } },
          { projection: { transaction: 1, cleanName: 1, category: 1 } }
        )
        .toArray();
    }

    const mappingByKey = new Map();
    for (const doc of mappingDocs) {
      const key = normalizeTransactionKey(doc.transaction);
      if (!key) {
        continue;
      }
      mappingByKey.set(key, {
        cleanName: typeof doc.cleanName === 'string' ? doc.cleanName : '',
        category: typeof doc.category === 'string' ? doc.category : ''
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
        category: mappedCategory || (typeof transaction.category === 'string' ? transaction.category : '')
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
      (monthNameFromStatements ? monthNameFromStatements.monthName.trim() : '') ||
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

module.exports = {
  handleCreateStatement,
  handleGetSummary,
  handleGetTransactions
};
