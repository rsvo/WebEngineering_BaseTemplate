import fastifyCors from '@fastify/cors';
import { drizzle } from 'drizzle-orm/node-postgres';
import Fastify, { type FastifyInstance } from 'fastify';
import type pg from 'pg';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { createBearRepository } from './bears/repository.js';
import { bearRoutes } from './bears/routes.js';
import type { Config } from './config.js';
import { commentRoutes } from './comments/routes.js';
import { CommentStore } from './comments/store.js';
import { createPool } from './db/pool.js';
import { registerOpenApi } from './openapi.js';
import {
  genReqId,
  REQUEST_ID_HEADER,
  registerProblemDetails,
} from './problems.js';
import { debugRoutes } from './routes/debug.js';
import { healthRoutes } from './routes/health.js';

export interface AppDependencies {
  db?: pg.Pool;
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

  // Only origins on the allow-list may read our responses from a browser.
  // Everything the web app needs and nothing more: its three methods, the one
  // non-safelisted request header it sends (content-type: application/json),
  // and the request id it shows in error messages. No credentials: the API
  // uses no cookies, so browsers never need to send them cross-origin.
  void app.register(fastifyCors, {
    origin: config.corsOrigins.length > 0 ? [...config.corsOrigins] : false,
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['content-type'],
    exposedHeaders: [REQUEST_ID_HEADER],
    credentials: false,
    // Browsers may reuse a preflight result for 10 minutes.
    maxAge: 600,
  });

  // OpenAPI document and Swagger UI at /api/docs, generated from the routes'
  // zod schemas; registered before the routes so it sees all of them.
  registerOpenApi(app);

  const db = dependencies.db ?? createPool(config.database, app.log);
  app.addHook('onClose', async () => {
    await db.end();
  });
  // Bears are read from the database; Wikipedia is only called by the seed.
  const bears = createBearRepository(drizzle(db));
  const comments = new CommentStore();

  void app.register(healthRoutes, { db });
  void app.register(bearRoutes, { prefix: '/api', bears });
  void app.register(commentRoutes, { prefix: '/api', bears, comments });
  if (config.enableDebugRoutes) {
    void app.register(debugRoutes, { prefix: '/api' });
  }

  return app;
}
