import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { NotFoundError } from '../errors.js';
import { problemResponses } from '../openapi.js';
import type { BearRepository } from './repository.js';
import {
  BearIdSchema,
  BearListSchema,
  BearSchema,
  type Bear,
} from './schema.js';

interface BearRoutesOptions {
  bears: BearRepository;
}

// Shared with the comment routes: unknown bears are a 404 everywhere.
export async function getBearOr404(
  bears: BearRepository,
  id: string
): Promise<Bear> {
  const bear = await bears.findById(id);
  if (bear === undefined) {
    throw new NotFoundError(`There is no bear with the id "${id}".`);
  }
  return bear;
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
          'Read from the database, ordered by binomial name. Filled from Wikipedia by `npm run db:seed`.',
        response: {
          200: BearListSchema,
          ...problemResponses(500),
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
          ...problemResponses(400, 404, 500),
        },
      },
    },
    async (request) => await getBearOr404(bears, request.params.id)
  );
};
