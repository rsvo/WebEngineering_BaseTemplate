import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { pino } from 'pino';
import { loadConfig } from '../config.js';
import { createPool } from './pool.js';

// Applies every migration in apps/api/drizzle that the database has not seen
// yet (tracked in drizzle.__drizzle_migrations). Same path from src/ and dist/.
const migrationsFolder = fileURLToPath(
  new URL('../../drizzle', import.meta.url)
);

const log = pino({ name: 'db:migrate' });
const pool = createPool(loadConfig().database, log);
try {
  await migrate(drizzle(pool), { migrationsFolder });
  log.info('migrations applied');
} catch (err) {
  log.error(err, 'migration failed');
  process.exitCode = 1;
} finally {
  await pool.end();
}
