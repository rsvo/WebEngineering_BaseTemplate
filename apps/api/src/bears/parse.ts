import { BearSchema, type Bear } from './schema.js';

export interface ParsedBear {
  bear: Omit<Bear, 'imageUrl'>;
  fileName: string | null;
}

function matchField(text: string, pattern: RegExp): string | null {
  const captured = text.match(pattern)?.[1]?.trim();
  return captured === undefined || captured === '' ? null : captured;
}

// The scientific name is unique per species and does not change, so a slug of
// it is a stable identifier that is safe to use in a URL.
export function toBearId(binomial: string): string {
  return binomial
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// The rows abbreviate the genus ("U. arctos"); the enclosing species table
// names it ("Ursus"). Expanding it gives the real, unambiguous binomial name.
function expandBinomial(binomial: string, genus: string | null): string {
  const abbreviated = binomial.match(/^([A-Z])\.\s*(.+)$/);
  if (abbreviated === null || genus === null) return binomial;
  const [, initial, epithet] = abbreviated;
  if (initial === undefined || epithet === undefined) return binomial;
  return genus.startsWith(initial) ? `${genus} ${epithet}` : binomial;
}

// The wikitext is a sequence of `{{Species table |genus=...}}` headers, each
// followed by its `{{Species table/row ...}}` entries.
export function parseBears(wikitext: string): ParsedBear[] {
  const parsed: ParsedBear[] = [];
  const seenIds = new Set<string>();
  let genus: string | null = null;

  for (const chunk of wikitext.split('{{Species table').slice(1)) {
    if (!chunk.startsWith('/row')) {
      // `[[Ursus (genus)|Ursus]]` -> "Ursus", `[[Ailuropoda]]` -> "Ailuropoda"
      genus = matchField(chunk, /\|genus=\[\[(?:[^\]|]*\|)?([^\]|]+)\]\]/);
      continue;
    }

    const name = matchField(chunk, /\|name=\[\[([^\]|]+)/);
    const rawBinomial = matchField(chunk, /\|binomial=([^\n|]+)/);
    if (name === null || rawBinomial === null) continue;

    const binomial = expandBinomial(rawBinomial, genus);
    // Rows that do not yield a valid bear are skipped rather than passed on.
    const result = BearSchema.omit({ imageUrl: true }).safeParse({
      id: toBearId(binomial),
      name,
      binomial,
      range: matchField(chunk, /\|range=([^\n|]+)/) ?? 'Unknown',
    });
    if (!result.success || seenIds.has(result.data.id)) continue;

    seenIds.add(result.data.id);
    parsed.push({
      bear: result.data,
      fileName: matchField(chunk, /\|image=(?:File:)?([^\n|]+)/),
    });
  }

  return parsed;
}
