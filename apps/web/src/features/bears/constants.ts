export const PLACEHOLDER_IMAGE = '/media/wild-bear.jpg';

export const WIKI_API_URL = 'https://en.wikipedia.org/w/api.php';
export const URSIDS_PAGE = 'List_of_ursids';

export const WIKITEXT_PARAMS = {
  action: 'parse',
  page: URSIDS_PAGE,
  prop: 'wikitext',
  section: '3',
  format: 'json',
  origin: '*',
};
