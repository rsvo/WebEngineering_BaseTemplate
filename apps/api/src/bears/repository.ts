import type { Bear } from './schema.js';

// What routes may ask about bears; how and where they are stored is up to the
// implementation (Drizzle in the app, in-memory in the tests).
export interface BearRepository {
  // Ordered by binomial name; `query` keeps bears whose name contains it
  // (case-insensitive).
  list: (query?: string) => Promise<readonly Bear[]>;
  findById: (id: string) => Promise<Bear | undefined>;
}

export function createInMemoryBearRepository(
  bears: readonly Bear[]
): BearRepository {
  return {
    list: async (query) =>
      query === undefined
        ? bears
        : bears.filter((bear) =>
            bear.name.toLowerCase().includes(query.toLowerCase())
          ),
    findById: async (id) => bears.find((bear) => bear.id === id),
  };
}
