import type { Bear } from './schema.js';

// What routes may ask about bears; how and where they are stored is up to the
// implementation (Drizzle in the app, in-memory in the tests).
export interface BearRepository {
  list: () => Promise<readonly Bear[]>;
  findById: (id: string) => Promise<Bear | undefined>;
}

export function createInMemoryBearRepository(
  bears: readonly Bear[]
): BearRepository {
  return {
    list: async () => bears,
    findById: async (id) => bears.find((bear) => bear.id === id),
  };
}
