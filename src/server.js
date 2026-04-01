const env = require('./config/env');
const db = require('./db/knex');
const { createApp } = require('./app');

async function start() {
  const app = await createApp();
  const server = app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Finance Dashboard API listening on port ${env.port}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await db.close();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start the server.', error);
  process.exit(1);
});
