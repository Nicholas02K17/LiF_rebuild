'use strict';

const config = require('./config');
const { createApp } = require('./app');

/**
 * Local review server only. The authoritative LiF application keeps its own
 * entry point; it uses `mount(app)` from src/app.js instead of this file.
 */

const app = createApp();

const server = app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`LiF Playground presentation layer on http://localhost:${config.port} (${config.env})`);
});

function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received — closing.`);
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
