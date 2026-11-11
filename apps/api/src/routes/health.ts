import type { FastifyInstance } from 'fastify';
import { VERSION } from '../version.js';

export interface HealthResponse {
  status: 'ok';
  version: string;
  uptime: number;
}

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async (_request, reply): Promise<HealthResponse> => {
    // A health check must always reflect the current state, never a cached one.
    void reply.header('cache-control', 'no-store');
    return {
      status: 'ok',
      version: VERSION,
      uptime: Math.round(process.uptime()),
    };
  });
}
