import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import { drizzle } from 'drizzle-orm/node-postgres';
import Fastify, { type FastifyInstance } from 'fastify';
import type pg from 'pg';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { createDrizzleUserRepository } from './auth/drizzle-repository.js';
import type { UserRepository } from './auth/repository.js';
import { registerAuth } from './auth/routes.js';
import { createAuthService } from './auth/service.js';
import { createDrizzleBearRepository } from './bears/drizzle-repository.js';
import type { BearRepository } from './bears/repository.js';
import { bearRoutes } from './bears/routes.js';
import type { Config } from './config.js';
import {
  createDrizzleCommentRepository,
  createDrizzleTransactor,
} from './comments/drizzle-repository.js';
import type { CommentRepository, Transactor } from './comments/repository.js';
import { commentRoutes } from './comments/routes.js';
import { createCommentService } from './comments/service.js';
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
  // Default: Drizzle on `db`. The tests pass in-memory implementations.
  bears?: BearRepository;
  comments?: CommentRepository;
  transaction?: Transactor;
  users?: UserRepository;
}

// Builds the app without listening, so it can also be exercised with
// `app.inject()` without opening a port. Plugins registered here are loaded
// lazily by Fastify on `ready()` / `listen()`.
export function buildApp(
  config: Config,
  dependencies: AppDependencies = {}
): FastifyInstance {
  const app = Fastify({
    // Our largest body is a comment of 2000 characters; anything far beyond
    // that is rejected with a 413 before it is parsed.
    bodyLimit: 16 * 1024,
    // Behind nginx every request comes from the proxy; only trusted proxies
    // may set the client IP (used by the rate limit) via X-Forwarded-For.
    trustProxy: config.trustProxy,
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

  // The API only accepts JSON. HTML forms can only send text/plain,
  // urlencoded or multipart bodies cross-site without a CORS preflight, so
  // a forged form POST is rejected with a 415 before any route code runs.
  app.removeContentTypeParser('text/plain');

  // One error format for everything, including 404s for unknown routes.
  registerProblemDetails(app);

  // Security headers on every response: nosniff, frame-ancestors 'none' via a
  // strict CSP, HSTS, no Referer leaks, ... The JSON API needs no exceptions;
  // Swagger UI sets its own CSP for its pages (see openapi.ts).
  void app.register(fastifyHelmet);

  // Only routes with a `config.rateLimit` are limited (login and register).
  void app.register(fastifyRateLimit, { global: false });

  // Only origins on the allow-list may read our responses from a browser.
  // Everything the web app needs and nothing more: its three methods, the one
  // non-safelisted request header it sends (content-type: application/json),
  // and the request id it shows in error messages. Credentials: the session
  // cookie, which is why the origin can never be "*".
  void app.register(fastifyCors, {
    origin: config.corsOrigins.length > 0 ? [...config.corsOrigins] : false,
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['content-type'],
    exposedHeaders: [REQUEST_ID_HEADER],
    credentials: true,
    // Browsers may reuse a preflight result for 10 minutes.
    maxAge: 600,
  });

  // OpenAPI document and Swagger UI at /api/docs, generated from the routes'
  // zod schemas; registered before the routes so it sees all of them.
  registerOpenApi(app);

  // The pool connects lazily, so with injected repositories it stays unused
  // (except by /health/ready).
  const db = dependencies.db ?? createPool(config.database, app.log);
  app.addHook('onClose', async () => {
    await db.end();
  });
  // At LOG_LEVEL=debug every SQL statement is logged (without parameters, as
  // they contain user input), e.g. to count the queries of a request.
  const orm = drizzle(db, {
    logger: {
      logQuery: (query) => {
        app.log.debug({ query }, 'sql');
      },
    },
  });
  // Routes only see the interfaces; the implementation is injected here.
  const bears = dependencies.bears ?? createDrizzleBearRepository(orm);
  const comments = dependencies.comments ?? createDrizzleCommentRepository(orm);
  const users = dependencies.users ?? createDrizzleUserRepository(orm);
  const commentService = createCommentService({
    comments,
    transaction: dependencies.transaction ?? createDrizzleTransactor(orm),
    reportMode: config.reportMode,
  });
  if (config.reportMode === 'naive') {
    app.log.warn('REPORT_MODE=naive: concurrent reports can get lost');
  }

  void app.register(healthRoutes, { db });
  registerAuth(app, {
    auth: createAuthService({ users }),
    secureCookies: config.secureCookies,
    rateLimit: {
      max: config.authRateLimit.max,
      timeWindow: config.authRateLimit.windowSeconds * 1000,
    },
  });
  void app.register(bearRoutes, { prefix: '/api', bears });
  void app.register(commentRoutes, {
    prefix: '/api',
    bears,
    comments,
    commentService,
  });
  if (config.enableDebugRoutes) {
    void app.register(debugRoutes, { prefix: '/api' });
  }

  return app;
}
