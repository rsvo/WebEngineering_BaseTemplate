import type { FastifyBaseLogger } from 'fastify';
import pg from 'pg';
import type { DatabaseConfig } from './config.js';

// One pool per process: connections are opened lazily, reused across requests
// and capped at `max`; further queries wait for a free connection.
export function createPool(
  config: DatabaseConfig,
  log: FastifyBaseLogger
): pg.Pool {
  const pool = new pg.Pool({
    connectionString: config.url,
    max: config.poolMax,
    // Fail fast while the database is down instead of hanging the request.
    connectionTimeoutMillis: 2000,
    idleTimeoutMillis: 30_000,
  });
  // An idle connection that breaks (e.g. the database restarts) emits 'error'
  // on the pool; unhandled, it would crash the process.
  pool.on('error', (err) => {
    log.warn({ err }, 'idle database connection failed');
  });
  return pool;
}
