import path from 'path';

const parsedPort = Number.parseInt(process.env.PORT ?? '3000', 10);
export const PORT = Number.isFinite(parsedPort) ? parsedPort : 3000;
export const NODE_ENV = process.env.NODE_ENV ?? 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017';
export const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME ?? 'app';

const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const publicDir = path.join(distDir, 'public');
const assetsDir = path.join(publicDir, 'assets');
const clientEntry = path.resolve(rootDir, 'src/index.tsx');
const clientBundlePath = path.join(assetsDir, 'client.js');

export const paths = {
  rootDir,
  distDir,
  publicDir,
  assetsDir,
  clientEntry,
  clientBundlePath
};
