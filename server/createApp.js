const express = require('express');
const React = require('react');
const { renderToString } = require('react-dom/server');
const { renderDocument } = require('./htmlTemplate');
const { paths, MONGODB_URI, MONGODB_DB_NAME } = require('./config');
const { connectToDatabase, getDatabase } = require('./database');
const statementsRouter = require('./routes/statements');
const placesRouter = require('./routes/places');

// App component must be required after Babel registration.
const App = require('../src/shared/App').default;

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

  app.use('/api/statements', statementsRouter);
  app.use('/api/places', placesRouter);

  app.get('*', (req, res) => {
    const html = renderReactApp(req.url);
    res.status(200).send(html);
  });

  return app;
}

module.exports = {
  createServerApp
};
