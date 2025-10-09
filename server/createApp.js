const express = require('express');
const React = require('react');
const { renderToString } = require('react-dom/server');
const { renderDocument } = require('./htmlTemplate');
const { paths, MONGODB_URI, MONGODB_DB_NAME } = require('./config');
const { connectToDatabase, getDatabase } = require('./database');

// App component must be required after Babel registration.
const App = require('../src/shared/App').default;

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
      fileName = ''
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
      const result = await db.collection('statements').insertOne({
        month: typeof month === 'string' ? month : '',
        fileName: typeof fileName === 'string' ? fileName : '',
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

  app.get('*', (req, res) => {
    const html = renderReactApp(req.url);
    res.status(200).send(html);
  });

  return app;
}

module.exports = {
  createServerApp
};
