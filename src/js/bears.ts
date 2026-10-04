import { fetchImageUrl, fetchUrsidWikitext } from './wikipedia';
import type { Bear, BearWithImage } from './types';

export const PLACEHOLDER_IMAGE = '/media/wild-bear.jpg';

function matchField(row: string, pattern: RegExp): string | null {
  const captured = row.match(pattern)?.[1];
  return typeof captured === 'string' ? captured.trim() : null;
}

function parseBearRows(wikitext: string): Bear[] {
  if (typeof wikitext !== 'string' || wikitext.length === 0) {
    throw new Error('Wikipedia returned empty bear data.');
  }

  const rows = wikitext.split('{{Species table/row').slice(1);
  const bears: Bear[] = [];
  const seenBinomials = new Set<string>();

  for (const row of rows) {
    const name = matchField(row, /\|name=\[\[([^\]|]+)/);
    const binomial = matchField(row, /\|binomial=([^\n|]+)/);
    if (name === null || binomial === null || seenBinomials.has(binomial))
      continue;

    seenBinomials.add(binomial);
    bears.push({
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
