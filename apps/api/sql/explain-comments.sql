-- The comments page query exactly as the repository sends it (first page and
-- a page deep in the list), without and with the index from migration 0001.
-- Run after `npm run db:seed:comments`:
--   docker compose exec -T db psql -U bears < apps/api/sql/explain-comments.sql

\echo '=== WITHOUT index (dropped inside a transaction, then rolled back) ==='
BEGIN;
DROP INDEX comments_bear_id_created_at_id_idx;

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT id, bear_id, author, text, created_at FROM comments
WHERE bear_id = 'ursus-arctos'
ORDER BY created_at DESC, id DESC LIMIT 21;

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT id, bear_id, author, text, created_at FROM comments
WHERE bear_id = 'ursus-arctos'
  AND (created_at, id) < (now() - interval '50000 minutes', 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid)
ORDER BY created_at DESC, id DESC LIMIT 21;

ROLLBACK;

\echo '=== WITH index on (bear_id, created_at, id) ==='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT id, bear_id, author, text, created_at FROM comments
WHERE bear_id = 'ursus-arctos'
ORDER BY created_at DESC, id DESC LIMIT 21;

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT id, bear_id, author, text, created_at FROM comments
WHERE bear_id = 'ursus-arctos'
  AND (created_at, id) < (now() - interval '50000 minutes', 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid)
ORDER BY created_at DESC, id DESC LIMIT 21;
