"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paths = exports.MONGODB_DB_NAME = exports.MONGODB_URI = exports.IS_PRODUCTION = exports.NODE_ENV = exports.PORT = void 0;
const path_1 = __importDefault(require("path"));
const parsedPort = Number.parseInt(process.env.PORT ?? '3000', 10);
exports.PORT = Number.isFinite(parsedPort) ? parsedPort : 3000;
exports.NODE_ENV = process.env.NODE_ENV ?? 'development';
exports.IS_PRODUCTION = exports.NODE_ENV === 'production';
exports.MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017';
exports.MONGODB_DB_NAME = process.env.MONGODB_DB_NAME ?? 'app';
const rootDir = path_1.default.resolve(__dirname, '..');
const distDir = path_1.default.resolve(rootDir, 'dist');
const publicDir = path_1.default.join(distDir, 'public');
const assetsDir = path_1.default.join(publicDir, 'assets');
const clientEntry = path_1.default.resolve(rootDir, 'src/index.tsx');
const clientBundlePath = path_1.default.join(assetsDir, 'client.js');
exports.paths = {
    rootDir,
    distDir,
    publicDir,
    assetsDir,
    clientEntry,
    clientBundlePath
};
