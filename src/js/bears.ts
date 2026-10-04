import { fetchImageUrl, fetchUrsidWikitext } from './wikipedia';
import { hideError, showError } from './errors';
import type { Bear, BearWithImage } from './types';

const PLACEHOLDER_IMAGE = '/media/wild-bear.jpg';

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

function attachPlaceholderFallback(img: HTMLImageElement): void {
  const handleError = (): void => {
    img.removeEventListener('error', handleError);
    if (img.getAttribute('src') !== PLACEHOLDER_IMAGE) {
      img.src = PLACEHOLDER_IMAGE;
    }
  };
  img.addEventListener('error', handleError);
}

function renderBear(bear: BearWithImage): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.className = 'bear';

  const img = document.createElement('img');
  img.alt = 'Image of ' + bear.name;
  attachPlaceholderFallback(img);
  img.src = bear.image;

  const title = document.createElement('p');
  const bold = document.createElement('b');
  bold.textContent = bear.name;
  title.appendChild(bold);
  title.appendChild(document.createTextNode(' (' + bear.binomial + ')'));

  const range = document.createElement('p');
  range.textContent = 'Range: ' + bear.range;

  wrap.appendChild(img);
  wrap.appendChild(title);
  wrap.appendChild(range);
  return wrap;
}

function renderBearList(container: Element, bears: BearWithImage[]): void {
  const fragment = document.createDocumentFragment();
  bears.forEach((bear) => {
    fragment.appendChild(renderBear(bear));
  });
  container.appendChild(fragment);
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

export async function initBears(): Promise<void> {
  const moreBears = document.querySelector('.more_bears');
  if (moreBears === null) {
    showError(
      document.querySelector('main'),
      new Error('The bear list is missing from the page.')
    );
    return;
  }

  hideError(moreBears);

  try {
    const wikitext = await fetchUrsidWikitext();
    const bears = parseBearRows(wikitext);
    const bearsWithImages = await Promise.all(bears.map(withResolvedImage));
    renderBearList(moreBears, bearsWithImages);
  } catch (err) {
    showError(moreBears, err);
  }
}
