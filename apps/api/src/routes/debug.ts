import type { FastifyInstance } from 'fastify';

// Only registered when ENABLE_DEBUG_ROUTES is on (default outside production).
export async function debugRoutes(app: FastifyInstance): Promise<void> {
  // Provokes an unexpected error, to show that a 500 reveals nothing but the
  // request id: the message below must appear in the log, never in the response.
  app.get('/debug/error', async () => {
    throw new Error(
      'Simulated bug: connection to db://admin:hunter2@10.0.0.5/comments refused'
    );
  });
}
