import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { pino } from 'pino';
import { loadConfig } from '../config.js';
import { createPool } from './pool.js';

// Load-test data for measuring the comments query: COUNT comments (default
// 100,000) spread evenly over the seeded bears, one per minute back in time.
// Generated inside Postgres in one statement instead of 100,000 round trips.
const count = Number(process.argv[2] ?? 100_000);

const log = pino({ name: 'db:seed:comments' });
const pool = createPool(loadConfig().database, log);
const db = drizzle(pool);
try {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`COUNT must be a positive integer, got "${count}"`);
  }
  const result = await db.execute(sql`
    INSERT INTO comments (bear_id, author, text, created_at)
    SELECT ids[1 + g % cardinality(ids)],
           'Load test',
           'Generated comment #' || g,
           now() - g * interval '1 minute'
    FROM generate_series(1, ${count}::int) AS g,
         (SELECT array_agg(id ORDER BY id) AS ids FROM bears) AS b
    WHERE cardinality(ids) > 0
  `);
  if (result.rowCount === 0) throw new Error('no bears, run db:seed first');
  // Fresh statistics, so the planner knows the table is no longer tiny.
  await db.execute(sql`ANALYZE comments`);
  log.info({ count: result.rowCount }, 'comments seeded');
} catch (err) {
  log.error(err, 'seeding comments failed');
  process.exitCode = 1;
} finally {
  await pool.end();
}
