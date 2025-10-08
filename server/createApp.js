const express = require('express');
const React = require('react');
const { renderToString } = require('react-dom/server');
const { renderDocument } = require('./htmlTemplate');
const { paths } = require('./config');

// App component must be required after Babel registration.
const App = require('../src/shared/App').default;

function renderReactApp(url) {
  const markup = renderToString(React.createElement(App, { url }));
  return renderDocument({ markup });
}

function createServerApp() {
  const app = express();

  app.use('/assets', express.static(paths.assetsDir));

  app.get('*', (req, res) => {
    const html = renderReactApp(req.url);
    res.status(200).send(html);
  });

  return app;
}

module.exports = {
  createServerApp
};
