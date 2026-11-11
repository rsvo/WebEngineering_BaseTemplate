import { buildApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const app = buildApp(config);

// In a container node runs as PID 1, which has no default signal handlers, so
// without this `docker compose stop` would wait for the timeout and SIGKILL.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    app.log.info({ signal }, 'shutting down');
    app.close().then(
      () => process.exit(0),
      (err: unknown) => {
        app.log.error(err, 'error during shutdown');
        process.exit(1);
      }
    );
  });
}

try {
  await app.listen({ host: config.host, port: config.port });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
