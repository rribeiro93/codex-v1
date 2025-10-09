const express = require('express');
const React = require('react');
const { renderToString } = require('react-dom/server');
const { renderDocument } = require('./htmlTemplate');
const { paths, MONGODB_URI, MONGODB_DB_NAME } = require('./config');
const { connectToDatabase, getDatabase } = require('./database');

// App component must be required after Babel registration.
const App = require('../src/shared/App').default;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

function getMonthNameFromIsoMonth(value) {
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

function extractIsoMonthFromFileName(fileName) {
  if (typeof fileName !== 'string') {
    return '';
  }

  const formatted = fileName.trim();
  if (!formatted) {
    return '';
  }

  const match = formatted.match(/Fatura(\d{4}-\d{2})-\d{2}\.csv$/i);
  return match ? match[1] : '';
}

function extractIsoMonthFromTransactions(transactions = []) {
  if (!Array.isArray(transactions)) {
    return '';
  }

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

function resolveStatementMonthName(month, fileName, transactions, providedMonthName) {
  if (typeof providedMonthName === 'string') {
    const trimmed = providedMonthName.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  const candidates = [
    typeof month === 'string' ? month : '',
    extractIsoMonthFromFileName(fileName),
    extractIsoMonthFromTransactions(transactions)
  ].filter(Boolean);

  for (const isoMonth of candidates) {
    const monthName = getMonthNameFromIsoMonth(isoMonth);
    if (monthName) {
      return monthName;
    }
  }

  return '';
}

function sanitizeTransaction(transaction = {}) {
  if (!transaction || typeof transaction !== 'object') {
    return null;
  }

  const sanitized = {
    date: typeof transaction.date === 'string' ? transaction.date : '',
    place: typeof transaction.place === 'string' ? transaction.place : '',
    category: typeof transaction.category === 'string' ? transaction.category : '',
    owner: typeof transaction.owner === 'string' ? transaction.owner : '',
    amount: Number.isFinite(transaction.amount) ? transaction.amount : 0
  };

  if (transaction.installments && typeof transaction.installments === 'object') {
    const current = Number.parseInt(transaction.installments.current, 10);
    const total = Number.parseInt(transaction.installments.total, 10);

    if (Number.isFinite(current) && Number.isFinite(total)) {
      sanitized.installments = { current, total };
    }
  }

  return sanitized;
}

function renderReactApp(url) {
  const markup = renderToString(React.createElement(App, { url }));
  return renderDocument({ markup });
}

async function createServerApp() {
  await connectToDatabase(MONGODB_URI, MONGODB_DB_NAME);
  const app = express();
  app.locals.db = getDatabase();

  app.use(express.json({ limit: '2mb' }));
  app.use('/assets', express.static(paths.assetsDir));

  app.post('/api/statements', async (req, res) => {
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
        .json({ statementId: result.insertedId.toHexString(), totalTransactions: sanitizedTransactions.length });
    } catch (error) {
      console.error('Failed to persist statement', error);
      return res.status(500).json({ error: 'Failed to persist statement.' });
    }
  });

  app.get('/api/statements/summary', async (req, res) => {
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
                  monthName: { $first: { $ifNull: ['$monthName', ''] } }
                }
              },
              { $sort: { _id: 1 } }
            ])
            .toArray()
        : [];

      const summary = rawSummary
        .filter((entry) => entry && typeof entry._id === 'string' && entry._id)
        .map((entry) => {
          const monthValue = typeof entry._id === 'string' && entry._id ? entry._id : 'Unknown';
          const amount =
            typeof entry.totalAmount === 'number' && Number.isFinite(entry.totalAmount)
              ? entry.totalAmount
              : 0;
          const derivedName =
            typeof entry.monthName === 'string' && entry.monthName
              ? entry.monthName
              : getMonthNameFromIsoMonth(monthValue);

          return {
            month: monthValue,
            monthName: derivedName || 'Unknown',
            totalAmount: Number.parseFloat(amount.toFixed(2))
          };
        });

      res.status(200).json({
        summary,
        years,
        selectedYear: targetYear
      });
    } catch (error) {
      console.error('Failed to load statement summary', error);
      res.status(500).json({ error: 'Failed to load statement summary.' });
    }
  });

  app.get('*', (req, res) => {
    const html = renderReactApp(req.url);
    res.status(200).send(html);
  });

  return app;
}

module.exports = {
  createServerApp
};
