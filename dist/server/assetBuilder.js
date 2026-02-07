"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAssetPipeline = startAssetPipeline;
const fs_1 = __importDefault(require("fs"));
const esbuild = __importStar(require("esbuild"));
const config_1 = require("./config");
function ensureDirectoryExists(directory) {
    if (!fs_1.default.existsSync(directory)) {
        fs_1.default.mkdirSync(directory, { recursive: true });
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
    ensureDirectoryExists(config_1.paths.assetsDir);
    const sharedOptions = {
        entryPoints: [config_1.paths.clientEntry],
        bundle: true,
        sourcemap: true,
        outfile: config_1.paths.clientBundlePath,
        loader: {
            '.js': 'jsx',
            '.jsx': 'jsx',
            '.ts': 'ts',
            '.tsx': 'tsx'
        },
        publicPath: '/assets',
        logLevel: 'info'
    };
    if (config_1.IS_PRODUCTION) {
        if (!fs_1.default.existsSync(config_1.paths.clientBundlePath)) {
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
