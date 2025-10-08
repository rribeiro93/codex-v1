const fs = require('fs');
const esbuild = require('esbuild');
const { IS_PRODUCTION, paths } = require('./config');

function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

async function buildClientBundle(options) {
  await esbuild.build(options);
}

async function createWatchContext(options) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  return ctx;
}

async function startAssetPipeline() {
  ensureDirectoryExists(paths.assetsDir);

  const sharedOptions = {
    entryPoints: [paths.clientEntry],
    bundle: true,
    sourcemap: true,
    outfile: paths.clientBundlePath,
    loader: {
      '.js': 'jsx',
      '.jsx': 'jsx'
    },
    publicPath: '/assets',
    logLevel: 'info'
  };

  if (IS_PRODUCTION) {
    if (!fs.existsSync(paths.clientBundlePath)) {
      await buildClientBundle({
        ...sharedOptions,
        minify: true
      });
    }
    return null;
  }

  const ctx = await createWatchContext(sharedOptions);
  return async () => {
    await ctx.dispose();
  };
}

module.exports = {
  startAssetPipeline
};
