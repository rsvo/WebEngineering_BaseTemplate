import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import type pg from 'pg';
import { z } from 'zod';
import { ServiceUnavailableError } from '../errors.js';
import { problemResponses } from '../openapi.js';
import { VERSION } from '../version.js';

const HealthSchema = z
  .object({
    status: z.literal('ok'),
    version: z.string().describe('Version of the running build.'),
    uptime: z.number().int().describe('Seconds since the process started.'),
  })
  .meta({ id: 'Health' });

export type HealthResponse = z.infer<typeof HealthSchema>;

interface HealthRoutesOptions {
  db: pg.Pool;
}

export const healthRoutes: FastifyPluginAsyncZod<HealthRoutesOptions> = async (
  app,
  { db }
) => {
  app.get(
    '/health',
    {
      schema: {
        tags: ['operations'],
        summary: 'Liveness check',
        description:
          'Is the process alive? Cheap, no side effects, checks no dependencies. Used by the Docker healthcheck.',
        response: { 200: HealthSchema, ...problemResponses(500) },
      },
    },
    async (_request, reply): Promise<HealthResponse> => {
      // A health check must always reflect the current state, never a cached one.
      void reply.header('cache-control', 'no-store');
      return {
        status: 'ok',
        version: VERSION,
        uptime: Math.round(process.uptime()),
      };
    }
  );

  app.get(
    '/health/ready',
    {
      schema: {
        tags: ['operations'],
        summary: 'Readiness check',
        description:
          'Can this instance serve requests? 200 only if `SELECT 1` on the database succeeds, otherwise 503. Wikipedia is deliberately not checked.',
        response: {
          200: z.object({ status: z.literal('ready') }),
          ...problemResponses(500, 503),
        },
      },
    },
    async (_request, reply) => {
      void reply.header('cache-control', 'no-store');
      try {
        await db.query('SELECT 1');
      } catch (err) {
        throw new ServiceUnavailableError('The database is not reachable.', {
          cause: err,
        });
      }
      return { status: 'ready' as const };
    }
  );
};
