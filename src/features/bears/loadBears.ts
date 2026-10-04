import { PLACEHOLDER_IMAGE } from './constants';
import { fetchImageUrl, fetchUrsidWikitext } from './wikipedia';
import type { Bear, BearWithImage } from './types';

function matchField(row: string, pattern: RegExp): string | null {
  const captured = row.match(pattern)?.[1];
  return typeof captured === 'string' ? captured.trim() : null;
}

// The scientific name is unique per species and never changes, so a slug of it
// is a stable identifier that is safe to use in a URL.
function toBearId(binomial: string): string {
  return binomial
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseBearRows(wikitext: string): Bear[] {
  if (typeof wikitext !== 'string' || wikitext.length === 0) {
    throw new Error('Wikipedia returned empty bear data.');
  }

  const rows = wikitext.split('{{Species table/row').slice(1);
  const bears: Bear[] = [];
  const seenIds = new Set<string>();

  for (const row of rows) {
    const name = matchField(row, /\|name=\[\[([^\]|]+)/);
    const binomial = matchField(row, /\|binomial=([^\n|]+)/);
    if (name === null || binomial === null) continue;

    const id = toBearId(binomial);
    if (id === '' || seenIds.has(id)) continue;

    seenIds.add(id);
    bears.push({
      id,
      name,
      binomial,
      fileName: matchField(row, /\|image=(?:File:)?([^\n|]+)/),
      range: matchField(row, /\|range=([^\n|]+)/) ?? 'Unknown',
    });
  }

  return bears;
}

async function withResolvedImage(
  bear: Bear,
  signal: AbortSignal
): Promise<BearWithImage> {
  const { fileName, ...rest } = bear;
  let image = PLACEHOLDER_IMAGE;

  if (fileName !== null) {
    try {
      image = (await fetchImageUrl(fileName, signal)) ?? PLACEHOLDER_IMAGE;
    } catch (err) {
      // A cancelled request must not be mistaken for a missing image.
      if (signal.aborted) throw err;
    }
  }

  return { ...rest, image };
}

export async function loadBears(signal: AbortSignal): Promise<BearWithImage[]> {
  const wikitext = await fetchUrsidWikitext(signal);
  const bears = parseBearRows(wikitext);
  return await Promise.all(
    bears.map(async (bear) => await withResolvedImage(bear, signal))
  );
}
