import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { problemResponses } from '../openapi.js';
import { BearIdSchema, BearListSchema, BearSchema } from './schema.js';
import type { BearService } from './service.js';

interface BearRoutesOptions {
  bears: BearService;
}

export const bearRoutes: FastifyPluginAsyncZod<BearRoutesOptions> = async (
  app,
  { bears }
) => {
  // Response schemas are enforced on the way out as well, so the API cannot
  // accidentally send something that breaks its own contract.
  app.get(
    '/bears',
    {
      schema: {
        tags: ['bears'],
        summary: 'List all bears',
        description:
          'Read from Wikipedia\'s "List of ursids" and cached for a few minutes. Never an empty list: if Wikipedia fails, the answer is 502 or 504.',
        response: {
          200: BearListSchema,
          ...problemResponses(500, 502, 504),
        },
      },
    },
    async () => await bears.list()
  );

  app.get(
    '/bears/:id',
    {
      schema: {
        tags: ['bears'],
        summary: 'Get one bear',
        params: z.object({ id: BearIdSchema }),
        response: {
          200: BearSchema,
          ...problemResponses(400, 404, 500, 502, 504),
        },
      },
    },
    async (request) => await bears.get(request.params.id)
  );
};
