import express from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../src/App';
import { renderDocument } from './htmlTemplate';
import { paths, MONGODB_URI, MONGODB_DB_NAME } from './config';
import { connectToDatabase, getDatabase } from './database';
import statementsRouter from './routes/statements';
import placesRouter from './routes/places';
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

  app.use('/api/statements', statementsRouter);
  app.use('/api/places', placesRouter);
  app.use('/api/categories', categoriesRouter);

  app.get('*', (req, res) => {
    const html = renderReactApp(req.url);
    res.status(200).send(html);
  });

  return app;
}
