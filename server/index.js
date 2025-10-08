require('./registerBabel');

const { PORT } = require('./config');
const { startAssetPipeline } = require('./assetBuilder');
const { createServerApp } = require('./createApp');

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
    } catch (disposeError) {
      console.error('Failed to dispose asset watcher', disposeError);
    }

    if (serverInstance) {
      serverInstance.close(() => {
        process.exit(0);
      });
      setTimeout(() => process.exit(0), 1000);
      return;
    }

    process.exit(0);
  };

  process.on('SIGINT', gracefullyShutdown);
  process.on('SIGTERM', gracefullyShutdown);

  try {
    disposeAssets = await startAssetPipeline();
    const app = createServerApp();

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
    process.exit(1);
  }
}

start();
