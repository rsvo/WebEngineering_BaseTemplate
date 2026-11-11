import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { problemResponses } from '../openapi.js';

// Only registered when ENABLE_DEBUG_ROUTES is on (default outside production).
export const debugRoutes: FastifyPluginAsyncZod = async (app) => {
  // Provokes an unexpected error, to show that a 500 reveals nothing but the
  // request id: the message below must appear in the log, never in the response.
  app.get(
    '/debug/error',
    {
      schema: {
        tags: ['operations'],
        summary: 'Provoke a 500 (development only)',
        description:
          'Throws an error whose message contains a fake secret. The response is a generic problem; the message is only in the log. Only exists with ENABLE_DEBUG_ROUTES=true.',
        response: problemResponses(500),
      },
    },
    async () => {
      throw new Error(
        'Simulated bug: connection to db://admin:hunter2@10.0.0.5/comments refused'
      );
    }
  );
};
