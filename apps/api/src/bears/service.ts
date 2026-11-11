import type { FastifyBaseLogger } from 'fastify';
import { NotFoundError, UpstreamError } from '../errors.js';
import { parseBears } from './parse.js';
import type { Bear } from './schema.js';
import type { WikipediaClient } from './wikipedia.js';

export interface BearService {
  list: () => Promise<readonly Bear[]>;
  get: (id: string) => Promise<Bear>;
}

interface CacheEntry {
  bears: readonly Bear[];
  expiresAt: number;
}

export function createBearService(
  wikipedia: WikipediaClient,
  log: FastifyBaseLogger,
  cacheTtlMs: number
): BearService {
  let cache: CacheEntry | null = null;
  // Concurrent requests during a cache miss share one upstream round trip.
  let inFlight: Promise<readonly Bear[]> | null = null;

  async function loadFromWikipedia(): Promise<readonly Bear[]> {
    const parsed = parseBears(await wikipedia.fetchUrsidWikitext());
    if (parsed.length === 0) {
      // "No bears" can only mean that the page changed or we failed to read
      // it, so it is reported as a failure and never as an empty list.
      throw new UpstreamError('Wikipedia returned no parsable bears.', 502);
    }

    // Images are optional: if they cannot be resolved, the bears are still
    // returned and the frontend shows its placeholder image.
    const fileNames = parsed.flatMap(({ fileName }) =>
      fileName === null ? [] : [fileName]
    );
    let imageUrls = new Map<string, string>();
    try {
      imageUrls = await wikipedia.fetchImageUrls(fileNames);
    } catch (err) {
      log.warn({ err }, 'could not resolve bear images, using placeholders');
    }

    return parsed.map(({ bear, fileName }) => ({
      ...bear,
      imageUrl: fileName === null ? null : (imageUrls.get(fileName) ?? null),
    }));
  }

  async function list(): Promise<readonly Bear[]> {
    if (cache !== null && cache.expiresAt > Date.now()) return cache.bears;

    inFlight ??= loadFromWikipedia()
      .then((bears) => {
        // Only successful results are cached; a failure is retried next time.
        cache = { bears, expiresAt: Date.now() + cacheTtlMs };
        return bears;
      })
      .finally(() => {
        inFlight = null;
      });
    return await inFlight;
  }

  async function get(id: string): Promise<Bear> {
    const bear = (await list()).find((candidate) => candidate.id === id);
    if (bear === undefined) {
      throw new NotFoundError(`There is no bear with the id "${id}".`);
    }
    return bear;
  }

  return { list, get };
}
