import Fastify, { type FastifyInstance } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { bearRoutes } from './bears/routes.js';
import { createBearService } from './bears/service.js';
import {
  createWikipediaClient,
  type WikipediaClient,
} from './bears/wikipedia.js';
import type { Config } from './config.js';
import { commentRoutes } from './comments/routes.js';
import { CommentStore } from './comments/store.js';
import { genReqId, registerProblemDetails } from './problems.js';
import { debugRoutes } from './routes/debug.js';
import { healthRoutes } from './routes/health.js';

export interface AppDependencies {
  wikipedia?: WikipediaClient;
}

// Builds the app without listening, so it can also be exercised with
// `app.inject()` without opening a port. Plugins registered here are loaded
// lazily by Fastify on `ready()` / `listen()`.
export function buildApp(
  config: Config,
  dependencies: AppDependencies = {}
): FastifyInstance {
  const app = Fastify({
    genReqId,
    // Every log line of a request carries its id under this key.
    requestIdLogLabel: 'requestId',
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

  // Request and response validation is done by the zod schemas of each route.
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // One error format for everything, including 404s for unknown routes.
  registerProblemDetails(app);

  const wikipedia =
    dependencies.wikipedia ?? createWikipediaClient(config.wikipedia);
  const bears = createBearService(wikipedia, app.log, config.bearsCacheTtlMs);
  const comments = new CommentStore();

  void app.register(healthRoutes);
  void app.register(bearRoutes, { prefix: '/api', bears });
  void app.register(commentRoutes, { prefix: '/api', bears, comments });
  if (config.enableDebugRoutes) {
    void app.register(debugRoutes, { prefix: '/api' });
  }

  return app;
}
