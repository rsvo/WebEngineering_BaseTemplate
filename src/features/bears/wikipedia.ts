import { WIKI_API_URL, WIKITEXT_PARAMS } from './constants';

function wikiRequestUrl(params: Record<string, string>): string {
  return `${WIKI_API_URL}?${new URLSearchParams(params).toString()}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

async function readWikipediaJson(
  res: Response
): Promise<Record<string, unknown>> {
  if (!res.ok) {
    throw new Error('Wikipedia request failed (status ' + res.status + ').');
  }

  const data: unknown = await res.json();
  if (!isRecord(data)) {
    throw new Error('Wikipedia returned an unexpected response shape.');
  }

  if (isRecord(data.error)) {
    throw new Error(
      readString(data.error.info) ?? 'Wikipedia returned an error.'
    );
  }

  return data;
}

function extractImageUrl(data: Record<string, unknown>): string | null {
  const query = data.query;
  if (!isRecord(query)) return null;

  const pages = query.pages;
  if (!isRecord(pages)) return null;

  const page = Object.values(pages)[0];
  if (!isRecord(page)) return null;

  const imageinfo = page.imageinfo;
  if (!Array.isArray(imageinfo) || imageinfo.length === 0) return null;

  const firstImage = imageinfo[0];
  if (!isRecord(firstImage)) return null;

  return readString(firstImage.url);
}

function extractWikitext(data: Record<string, unknown>): string | null {
  const parse = data.parse;
  if (!isRecord(parse)) return null;

  const wikitext = parse.wikitext;
  if (!isRecord(wikitext)) return null;

  return readString(wikitext['*']);
}

export async function fetchImageUrl(
  fileName: string,
  signal?: AbortSignal
): Promise<string | null> {
  const imageParams = {
    action: 'query',
    titles: 'File:' + fileName,
    prop: 'imageinfo',
    iiprop: 'url',
    format: 'json',
    origin: '*',
  };

  const data = await readWikipediaJson(
    await fetch(wikiRequestUrl(imageParams), { signal })
  );
  return extractImageUrl(data);
}

export async function fetchUrsidWikitext(
  signal?: AbortSignal
): Promise<string> {
  const data = await readWikipediaJson(
    await fetch(wikiRequestUrl(WIKITEXT_PARAMS), { signal })
  );
  const wikitext = extractWikitext(data);
  if (wikitext === null) {
    throw new Error('Wikipedia did not return the ursid list text.');
  }
  return wikitext;
}
