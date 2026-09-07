import { fetchImageUrl, fetchUrsidWikitext } from './wikipedia.js';

var PLACEHOLDER_IMAGE = 'media/wild-bear.jpg';

function parseBearRows(wikitext) {
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

  return bears;
}

function renderBear(container, bear) {
  var wrap = document.createElement('div');
  wrap.className = 'bear';

  var img = document.createElement('img');
  img.src = bear.image;
  img.alt = 'Image of ' + bear.name;
  img.style.width = '200px';
  img.style.height = 'auto';

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
  var bears = parseBearRows(wikitext);
  var moreBears = document.querySelector('.more_bears');

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

  Promise.all(imagePromises).then(function(urls) {
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
  fetchUrsidWikitext()
    .then(function(wikitext) {
      extractBears(wikitext);
    });
}
