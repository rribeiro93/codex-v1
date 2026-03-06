import express from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../src/App';
import { renderDocument } from './htmlTemplate';
import { paths, MONGODB_URI, MONGODB_DB_NAME } from './config';
import { connectToDatabase, getDatabase } from './database';
import transactionsRouter from './routes/transactions';
import categoriesRouter from './routes/categories';

function renderReactApp(url: string) {
  const markup = renderToString(React.createElement(App, { url }));
  return renderDocument({ markup });
}

export async function createServerApp() {
  await connectToDatabase(MONGODB_URI, MONGODB_DB_NAME);

  const app = express();
  app.locals.db = getDatabase();

  app.use(express.json({ limit: '2mb' }));
  app.use('/assets', express.static(paths.assetsDir));

  app.use('/api/transactions', transactionsRouter);
  app.use('/api/categories', categoriesRouter);

  app.get('*', (req, res) => {
    const html = renderReactApp(req.url);
    res.status(200).send(html);
  });

  return app;
}
