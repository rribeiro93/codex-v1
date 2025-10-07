const path = require('path');
const express = require('express');

require('@babel/register')({
  extensions: ['.js', '.jsx'],
  presets: [
    [
      '@babel/preset-env',
      { targets: { node: 'current' } }
    ],
    [
      '@babel/preset-react',
      { runtime: 'automatic' }
    ]
  ],
  ignore: [/node_modules/]
});

const React = require('react');
const { renderToString } = require('react-dom/server');
const App = require('../src/shared/App').default;

const PORT = process.env.PORT || 3000;
const app = express();

const publicDir = path.resolve(__dirname, '../dist/public');
app.use('/assets', express.static(path.join(publicDir, 'assets')));

function createHtml(markup) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React SSR Base</title>
    <link rel="icon" href="data:," />
  </head>
  <body>
    <div id="root">${markup}</div>
    <script type="module" src="/assets/client.js" defer></script>
  </body>
</html>`;
}

app.get('*', (req, res) => {
  const appHtml = renderToString(React.createElement(App, { url: req.url }));
  res.status(200).send(createHtml(appHtml));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
