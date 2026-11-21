import pg from 'pg';
import { z } from 'zod';
import { loadConfig } from '../config.js';

// Lost-update demo: creates a comment, sends REPORTS (default 50) reports for
// it at the same time and reads the final report_count from the database.
// Run against an API with REPORT_MODE=naive and again with the default.
const env = z
  .object({
    API_URL: z.url().default('http://localhost:3000'),
    REPORTS: z.coerce.number().int().min(1).max(1000).default(50),
  })
  .parse(process.env);
const apiUrl = env.API_URL.replace(/\/+$/, '');
const reports = env.REPORTS;

async function api(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${apiUrl}/api${path}`, init);
  if (!response.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${path}: ${response.status}`);
  }
  return await response.json();
}

const pool = new pg.Pool({ connectionString: loadConfig().database.url });
try {
  const [bear] = (await api('/bears')) as Array<{ id: string }>;
  if (bear === undefined) throw new Error('no bears, run db:seed first');
  // Inserted directly: creating comments over HTTP needs a login.
  const created = await pool.query<{ id: string }>(
    "INSERT INTO comments (bear_id, author, text) VALUES ($1, 'Race script', 'Report me!') RETURNING id",
    [bear.id]
  );
  const id = created.rows[0]?.id ?? '';

  const results = (await Promise.all(
    Array.from(
      { length: reports },
      async () => await api(`/comments/${id}/report`, { method: 'POST' })
    )
  )) as Array<{ reportCount: number }>;
  const distinct = new Set(results.map((result) => result.reportCount)).size;

  const { rows } = await pool.query<{
    report_count: number;
    hidden_at: Date | null;
  }>('SELECT report_count, hidden_at FROM comments WHERE id = $1', [id]);
  const final = rows[0]?.report_count ?? 0;

  console.log(`comment ${id}`);
  console.log(`sent ${reports} concurrent reports, all answered 200`);
  console.log(`distinct counts in the responses: ${distinct}`);
  console.log(`final report_count: ${final} (lost: ${reports - final})`);
  console.log(`hidden: ${rows[0]?.hidden_at != null}`);
  process.exitCode = final === reports ? 0 : 1;
} finally {
  await pool.end();
}
