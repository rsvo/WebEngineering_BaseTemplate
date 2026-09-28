const WIKI_API_URL = 'https://en.wikipedia.org/w/api.php';
const URSIDS_PAGE = 'List_of_ursids';

const wikitextParams = {
  action: 'parse',
  page: URSIDS_PAGE,
  prop: 'wikitext',
  section: 3,
  format: 'json',
  origin: '*'
};

function wikiRequestUrl(params) {
  return `${WIKI_API_URL}?${new URLSearchParams(params)}`;
}

async function readWikipediaJson(res) {
  if (!res.ok) {
    throw new Error('Wikipedia request failed (status ' + res.status + ').');
  }
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.info || 'Wikipedia returned an error.');
  }
  return data;
}

export async function fetchImageUrl(fileName) {
  const imageParams = {
    action: 'query',
    titles: 'File:' + fileName,
    prop: 'imageinfo',
    iiprop: 'url',
    format: 'json',
    origin: '*'
  };

  const data = await readWikipediaJson(await fetch(wikiRequestUrl(imageParams)));
  const pages = data.query && data.query.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0];
  const url = page && page.imageinfo && page.imageinfo[0] && page.imageinfo[0].url;
  return url || null;
}

export async function fetchUrsidWikitext() {
  const data = await readWikipediaJson(await fetch(wikiRequestUrl(wikitextParams)));
  const wikitext = data.parse && data.parse.wikitext && data.parse.wikitext['*'];
  if (!wikitext) {
    throw new Error('Wikipedia did not return the ursid list text.');
  }
  return wikitext;
}
