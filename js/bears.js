import { fetchImageUrl, fetchUrsidWikitext } from './wikipedia.js';
import { hideError, showError } from './errors.js';

const PLACEHOLDER_IMAGE = 'media/wild-bear.jpg';

function matchField(row, pattern) {
  const match = row.match(pattern);
  return match ? match[1].trim() : null;
}

function parseBearRows(wikitext) {
  if (typeof wikitext !== 'string' || !wikitext) {
    throw new Error('Wikipedia returned empty bear data.');
  }

  const rows = wikitext.split('{{Species table/row').slice(1);
  const bears = [];
  const seenBinomials = new Set();

  for (const row of rows) {
    const name = matchField(row, /\|name=\[\[([^\]|]+)/);
    const binomial = matchField(row, /\|binomial=([^\n|]+)/);
    if (!name || !binomial || seenBinomials.has(binomial)) continue;

    seenBinomials.add(binomial);
    bears.push({
      name,
      binomial,
      fileName: matchField(row, /\|image=(?:File:)?([^\n|]+)/),
      range: matchField(row, /\|range=([^\n|]+)/) || 'Unknown'
    });
  }

  if (!bears.length) {
    throw new Error('No bear species were found in the Wikipedia data.');
  }

  return bears;
}

function usePlaceholderIfImageFails(img) {
  const handleError = () => {
    img.removeEventListener('error', handleError);
    if (img.getAttribute('src') !== PLACEHOLDER_IMAGE) {
      img.src = PLACEHOLDER_IMAGE;
    }
  };
  img.addEventListener('error', handleError);
}

function renderBear(bear) {
  const wrap = document.createElement('div');
  wrap.className = 'bear';

  const img = document.createElement('img');
  img.alt = 'Image of ' + bear.name;
  usePlaceholderIfImageFails(img);
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

function renderBearList(container, bears) {
  const fragment = document.createDocumentFragment();
  bears.forEach((bear) => {
    fragment.appendChild(renderBear(bear));
  });
  container.appendChild(fragment);
}

async function withResolvedImage(bear) {
  if (!bear.fileName) {
    return { name: bear.name, binomial: bear.binomial, range: bear.range, image: PLACEHOLDER_IMAGE };
  }

  try {
    const url = await fetchImageUrl(bear.fileName);
    return {
      name: bear.name,
      binomial: bear.binomial,
      range: bear.range,
      image: url || PLACEHOLDER_IMAGE
    };
  } catch (err) {
    return { name: bear.name, binomial: bear.binomial, range: bear.range, image: PLACEHOLDER_IMAGE };
  }
}

export async function initBears() {
  const moreBears = document.querySelector('.more_bears');
  if (!moreBears) {
    showError(document.querySelector('main'), new Error('The bear list is missing from the page.'));
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
