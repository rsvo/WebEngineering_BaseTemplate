import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
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
    { schema: { response: { 200: BearListSchema } } },
    async () => await bears.list()
  );

  app.get(
    '/bears/:id',
    {
      schema: {
        params: z.object({ id: BearIdSchema }),
        response: { 200: BearSchema },
      },
    },
    async (request) => await bears.get(request.params.id)
  );
};
