"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const config_1 = require("./config");
const assetBuilder_1 = require("./assetBuilder");
const createApp_1 = require("./createApp");
const database_1 = require("./database");
async function start() {
    let disposeAssets = null;
    let serverInstance = null;
    let shuttingDown = false;
    const gracefullyShutdown = async () => {
        if (shuttingDown) {
            return;
        }
        shuttingDown = true;
        try {
            if (disposeAssets) {
                await disposeAssets();
            }
        }
        catch (disposeError) {
            console.error('Failed to dispose asset watcher', disposeError);
        }
        if (serverInstance) {
            serverInstance.close(() => {
                process.exit(0);
            });
            setTimeout(() => process.exit(0), 1000);
            try {
                await (0, database_1.disconnectFromDatabase)();
            }
            catch (dbError) {
                console.error('Failed to disconnect database', dbError);
            }
            return;
        }
        try {
            await (0, database_1.disconnectFromDatabase)();
        }
        catch (dbError) {
            console.error('Failed to disconnect database', dbError);
        }
        process.exit(0);
    };
    process.on('SIGINT', gracefullyShutdown);
    process.on('SIGTERM', gracefullyShutdown);
    try {
        disposeAssets = await (0, assetBuilder_1.startAssetPipeline)();
        const app = await (0, createApp_1.createServerApp)();
        serverInstance = app.listen(config_1.PORT, () => {
            console.log(`Server listening on http://localhost:${config_1.PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server', error);
        if (disposeAssets) {
            try {
                await disposeAssets();
            }
            catch (disposeError) {
                console.error('Failed to dispose asset watcher', disposeError);
            }
        }
        try {
            await (0, database_1.disconnectFromDatabase)();
        }
        catch (dbError) {
            console.error('Failed to disconnect database', dbError);
        }
        process.exit(1);
    }
}
start().catch((error) => {
    console.error('Unhandled error when starting server', error);
    process.exit(1);
});
