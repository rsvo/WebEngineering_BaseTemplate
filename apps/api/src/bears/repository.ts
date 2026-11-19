import { asc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { bears } from '../db/schema.js';
import { NotFoundError } from '../errors.js';
import type { Bear } from './schema.js';
import type { BearService } from './service.js';

// The API's Bear, without the bookkeeping column fetched_at.
const columns = {
  id: bears.id,
  name: bears.name,
  binomial: bears.binomial,
  range: bears.range,
  imageUrl: bears.imageUrl,
};

// Same interface as the Wikipedia service, so routes do not care where bears
// come from. An unseeded database simply has no bears yet.
export function createBearRepository(db: NodePgDatabase): BearService {
  async function list(): Promise<readonly Bear[]> {
    return await db.select(columns).from(bears).orderBy(asc(bears.binomial));
  }

  async function get(id: string): Promise<Bear> {
    const [bear] = await db.select(columns).from(bears).where(eq(bears.id, id));
    if (bear === undefined) {
      throw new NotFoundError(`There is no bear with the id "${id}".`);
    }
    return bear;
  }

  return { list, get };
}
