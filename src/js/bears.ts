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

  if (bears.length === 0) {
    throw new Error('No bear species were found in the Wikipedia data.');
  }

  return bears;
}

async function withResolvedImage(bear: Bear): Promise<BearWithImage> {
  if (bear.fileName === null) {
    return {
      name: bear.name,
      binomial: bear.binomial,
      range: bear.range,
      image: PLACEHOLDER_IMAGE,
    };
  }

  try {
    const url = await fetchImageUrl(bear.fileName);
    return {
      name: bear.name,
      binomial: bear.binomial,
      range: bear.range,
      image: url ?? PLACEHOLDER_IMAGE,
    };
  } catch (err) {
    return {
      name: bear.name,
      binomial: bear.binomial,
      range: bear.range,
      image: PLACEHOLDER_IMAGE,
    };
  }
}

export async function loadBears(): Promise<BearWithImage[]> {
  const wikitext = await fetchUrsidWikitext();
  const bears = parseBearRows(wikitext);
  return await Promise.all(bears.map(withResolvedImage));
}
