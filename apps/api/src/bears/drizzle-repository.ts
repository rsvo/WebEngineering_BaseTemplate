import { asc, eq, ilike } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { bears } from '../db/schema.js';
import type { BearRepository } from './repository.js';

// The API's Bear, without the bookkeeping column fetched_at.
const columns = {
  id: bears.id,
  name: bears.name,
  binomial: bears.binomial,
  range: bears.range,
  imageUrl: bears.imageUrl,
};

// `%` and `_` are wildcards in LIKE; escaped, the query matches literally.
const escapeLike = (value: string): string => value.replace(/[\\%_]/g, '\\$&');

export function createDrizzleBearRepository(
  db: NodePgDatabase
): BearRepository {
  return {
    // A leading wildcard cannot use a B-tree index, which is fine for a
    // handful of bears (pg_trgm would be the fix for a large table).
    list: async (query) =>
      await db
        .select(columns)
        .from(bears)
        .where(
          query === undefined
            ? undefined
            : ilike(bears.name, `%${escapeLike(query)}%`)
        )
        .orderBy(asc(bears.binomial)),

    findById: async (id) => {
      const [bear] = await db
        .select(columns)
        .from(bears)
        .where(eq(bears.id, id));
      return bear;
    },
  };
}
