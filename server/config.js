const path = require('path');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'app';

const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const publicDir = path.join(distDir, 'public');
const assetsDir = path.join(publicDir, 'assets');
const clientEntry = path.resolve(rootDir, 'src/client/index.jsx');
const clientBundlePath = path.join(assetsDir, 'client.js');

const paths = {
  rootDir,
  distDir,
  publicDir,
  assetsDir,
  clientEntry,
  clientBundlePath
};

module.exports = {
  PORT,
  NODE_ENV,
  IS_PRODUCTION,
  MONGODB_URI,
  MONGODB_DB_NAME,
  paths
};
