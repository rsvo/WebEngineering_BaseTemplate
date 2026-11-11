import Fastify, { type FastifyInstance } from 'fastify';
import type { Config } from './config.js';
import { healthRoutes } from './routes/health.js';

// Builds the app without listening, so it can also be exercised with
// `app.inject()` without opening a port. Plugins registered here are loaded
// lazily by Fastify on `ready()` / `listen()`.
export function buildApp(config: Config): FastifyInstance {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      ...(config.prettyLogs
        ? {
            transport: {
              target: 'pino-pretty',
              options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
            },
          }
        : {}),
    },
  });

  void app.register(healthRoutes);

  return app;
}
