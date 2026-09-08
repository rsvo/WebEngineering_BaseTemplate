import { fetchImageUrl, fetchUrsidWikitext } from './wikipedia.js';
import { hideError, showError } from './errors.js';

var PLACEHOLDER_IMAGE = 'media/wild-bear.jpg';

function parseBearRows(wikitext) {
  if (typeof wikitext !== 'string' || !wikitext) {
    throw new Error('Wikipedia returned empty bear data.');
  }

  var rows = wikitext.split('{{Species table/row').slice(1);
  var bears = [];
  var seen = {};

  rows.forEach((row) => {
    var nameMatch = row.match(/\|name=\[\[([^\]|]+)/);
    var binomialMatch = row.match(/\|binomial=([^\n|]+)/);
    if (!nameMatch || !binomialMatch) return;

    var name = nameMatch[1].trim();
    var binomial = binomialMatch[1].trim();
    if (seen[binomial]) return;
    seen[binomial] = true;

    var imageMatch = row.match(/\|image=(?:File:)?([^\n|]+)/);
    var rangeMatch = row.match(/\|range=([^\n|]+)/);

    bears.push({
      name: name,
      binomial: binomial,
      fileName: imageMatch ? imageMatch[1].trim() : null,
      range: rangeMatch ? rangeMatch[1].trim() : 'Unknown'
    });
  });

  if (!bears.length) {
    throw new Error('No bear species were found in the Wikipedia data.');
  }

  return bears;
}

function usePlaceholderIfImageFails(img) {
  var handleError = () => {
    img.removeEventListener('error', handleError);
    if (img.getAttribute('src') !== PLACEHOLDER_IMAGE) {
      img.src = PLACEHOLDER_IMAGE;
    }
  };
  img.addEventListener('error', handleError);
}

function renderBear(container, bear) {
  var wrap = document.createElement('div');
  wrap.className = 'bear';

  var img = document.createElement('img');
  img.alt = 'Image of ' + bear.name;
  img.style.width = '200px';
  img.style.height = 'auto';
  usePlaceholderIfImageFails(img);
  img.src = bear.image;

  var title = document.createElement('p');
  var bold = document.createElement('b');
  bold.textContent = bear.name;
  title.appendChild(bold);
  title.appendChild(document.createTextNode(' (' + bear.binomial + ')'));

  var range = document.createElement('p');
  range.textContent = 'Range: ' + bear.range;

  wrap.appendChild(img);
  wrap.appendChild(title);
  wrap.appendChild(range);
  container.appendChild(wrap);
}

async function resolveImageUrl(bear) {
  if (!bear.fileName) {
    return PLACEHOLDER_IMAGE;
  }
  try {
    var url = await fetchImageUrl(bear.fileName);
    return url || PLACEHOLDER_IMAGE;
  } catch (err) {
    return PLACEHOLDER_IMAGE;
  }
}

async function extractBears(wikitext) {
  var moreBears = document.querySelector('.more_bears');
  if (!moreBears) {
    throw new Error('The bear list is missing from the page.');
  }

  var bears = parseBearRows(wikitext);
  var urls = await Promise.all(bears.map(resolveImageUrl));

  bears.forEach((bear, i) => {
    renderBear(moreBears, {
      name: bear.name,
      binomial: bear.binomial,
      image: urls[i],
      range: bear.range
    });
  });
}

export async function initBears() {
  var moreBears = document.querySelector('.more_bears');
  hideError(moreBears);

  try {
    var wikitext = await fetchUrsidWikitext();
    await extractBears(wikitext);
  } catch (err) {
    showError(moreBears, err);
  }
}
