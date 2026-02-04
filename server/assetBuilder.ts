import fs from 'fs';
import * as esbuild from 'esbuild';
import { IS_PRODUCTION, paths } from './config';

function ensureDirectoryExists(directory: string) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

async function buildClientBundle(options: esbuild.BuildOptions) {
  await esbuild.build(options);
}

async function createWatchContext(options: esbuild.BuildOptions) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  return ctx;
}

export async function startAssetPipeline() {
  ensureDirectoryExists(paths.assetsDir);

  const sharedOptions: esbuild.BuildOptions = {
    entryPoints: [paths.clientEntry],
    bundle: true,
    sourcemap: true,
    outfile: paths.clientBundlePath,
    loader: {
      '.js': 'jsx',
      '.jsx': 'jsx',
      '.ts': 'ts',
      '.tsx': 'tsx'
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
