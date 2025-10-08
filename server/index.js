const fs = require('fs');
const path = require('path');
const express = require('express');
const esbuild = require('esbuild');

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
const assetsDir = path.join(publicDir, 'assets');
const clientEntry = path.resolve(__dirname, '../src/client/index.jsx');
const clientBundlePath = path.join(assetsDir, 'client.js');

async function ensureClientBundle() {
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const sharedOptions = {
    entryPoints: [clientEntry],
    bundle: true,
    sourcemap: true,
    outfile: clientBundlePath,
    loader: {
      '.js': 'jsx',
      '.jsx': 'jsx'
    },
    publicPath: '/assets'
  };

  if (process.env.NODE_ENV !== 'production') {
    const ctx = await esbuild.context({
      ...sharedOptions,
      logLevel: 'info'
    });
    await ctx.watch();

    const dispose = async () => {
      await ctx.dispose();
      process.exit(0);
    };

    process.on('SIGINT', dispose);
    process.on('SIGTERM', dispose);
  } else if (!fs.existsSync(clientBundlePath)) {
    await esbuild.build({
      ...sharedOptions,
      minify: true
    });
  }
}

app.use('/assets', express.static(assetsDir));

function createHtml(markup) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React SSR Base</title>
    <link rel="icon" href="data:," />
    <style>
      body {
        margin: 0;
      }
    </style>
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

ensureClientBundle()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start asset builder', err);
    process.exit(1);
  });
