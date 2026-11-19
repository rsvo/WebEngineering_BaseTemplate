import pg from 'pg';
import { loadConfig } from '../config.js';

// Lost-update demo: creates a comment, sends REPORTS (default 50) reports for
// it at the same time and reads the final report_count from the database.
// Run against an API with REPORT_MODE=naive and again with the default.
const apiUrl = (process.env.API_URL ?? 'http://localhost:3000').replace(
  /\/+$/,
  ''
);
const reports = Number(process.env.REPORTS ?? 50);

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
  const { id } = (await api(`/bears/${bear.id}/comments`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ author: 'Race script', text: 'Report me!' }),
  })) as { id: string };

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
