import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
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

export const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/health',
    {
      schema: {
        tags: ['operations'],
        summary: 'Liveness check',
        description:
          'Cheap and without side effects; does not call Wikipedia. Used by the Docker healthcheck.',
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
};
