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

  rows.forEach(function(row) {
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
  function handleError() {
    img.removeEventListener('error', handleError);
    if (img.getAttribute('src') !== PLACEHOLDER_IMAGE) {
      img.src = PLACEHOLDER_IMAGE;
    }
  }
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

function extractBears(wikitext) {
  var moreBears = document.querySelector('.more_bears');
  if (!moreBears) {
    throw new Error('The bear list is missing from the page.');
  }

  var bears = parseBearRows(wikitext);

  var imagePromises = bears.map(function(bear) {
    if (!bear.fileName) {
      return Promise.resolve(PLACEHOLDER_IMAGE);
    }
    return fetchImageUrl(bear.fileName).then(function(url) {
      return url || PLACEHOLDER_IMAGE;
    }, function() {
      return PLACEHOLDER_IMAGE;
    });
  });

  return Promise.all(imagePromises).then(function(urls) {
    bears.forEach(function(bear, i) {
      renderBear(moreBears, {
        name: bear.name,
        binomial: bear.binomial,
        image: urls[i],
        range: bear.range
      });
    });
  });
}

export function initBears() {
  var moreBears = document.querySelector('.more_bears');
  hideError(moreBears);

  fetchUrsidWikitext()
    .then(function(wikitext) {
      try {
        return extractBears(wikitext);
      } catch (err) {
        showError(moreBears, err);
      }
    })
    .catch(function(err) {
      showError(moreBears, err);
    });
}
