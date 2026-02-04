import 'dotenv/config';
import type { Server } from 'http';
import { PORT } from './config';
import { startAssetPipeline } from './assetBuilder';
import { createServerApp } from './createApp';
import { disconnectFromDatabase } from './database';

async function start() {
  let disposeAssets: (() => Promise<void>) | null = null;
  let serverInstance: Server | null = null;
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
    } catch (disposeError) {
      console.error('Failed to dispose asset watcher', disposeError);
    }

    if (serverInstance) {
      serverInstance.close(() => {
        process.exit(0);
      });
      setTimeout(() => process.exit(0), 1000);
      try {
        await disconnectFromDatabase();
      } catch (dbError) {
        console.error('Failed to disconnect database', dbError);
      }
      return;
    }

    try {
      await disconnectFromDatabase();
    } catch (dbError) {
      console.error('Failed to disconnect database', dbError);
    }

    process.exit(0);
  };

  process.on('SIGINT', gracefullyShutdown);
  process.on('SIGTERM', gracefullyShutdown);

  try {
    disposeAssets = await startAssetPipeline();
    const app = await createServerApp();

    serverInstance = app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    if (disposeAssets) {
      try {
        await disposeAssets();
      } catch (disposeError) {
        console.error('Failed to dispose asset watcher', disposeError);
      }
    }
    try {
      await disconnectFromDatabase();
    } catch (dbError) {
      console.error('Failed to disconnect database', dbError);
    }
    process.exit(1);
  }
}

start().catch((error) => {
  console.error('Unhandled error when starting server', error);
  process.exit(1);
});
