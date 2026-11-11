import { readFileSync } from 'node:fs';
import type { FastifyInstance } from 'fastify';

// `../../package.json` resolves to apps/api/package.json both from src/routes
// (tsx) and from dist/routes (node), so the reported version always matches the
// code that is actually running.
function readVersion(): string {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
  );
  if (
    typeof raw === 'object' &&
    raw !== null &&
    'version' in raw &&
    typeof raw.version === 'string'
  ) {
    return raw.version;
  }
  return 'unknown';
}

const VERSION = readVersion();

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
