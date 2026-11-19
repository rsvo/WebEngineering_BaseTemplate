import { asc, eq } from 'drizzle-orm';
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

export function createDrizzleBearRepository(
  db: NodePgDatabase
): BearRepository {
  return {
    list: async () =>
      await db.select(columns).from(bears).orderBy(asc(bears.binomial)),

    findById: async (id) => {
      const [bear] = await db
        .select(columns)
        .from(bears)
        .where(eq(bears.id, id));
      return bear;
    },
  };
}
