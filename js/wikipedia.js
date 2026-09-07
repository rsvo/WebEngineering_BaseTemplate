export var baseUrl = "https://en.wikipedia.org/w/api.php";
var title = "List_of_ursids";

var wikitextParams = {
  action: "parse",
  page: title,
  prop: "wikitext",
  section: 3,
  format: "json",
  origin: "*"
};

function readWikipediaJson(res) {
  if (!res.ok) {
    throw new Error('Wikipedia request failed (status ' + res.status + ').');
  }
  return res.json().then(function(data) {
    if (data.error) {
      throw new Error(data.error.info || 'Wikipedia returned an error.');
    }
    return data;
  });
}

export function fetchImageUrl(fileName) {
  var imageParams = {
    action: "query",
    titles: "File:" + fileName,
    prop: "imageinfo",
    iiprop: "url",
    format: "json",
    origin: "*"
  };

  var url = baseUrl + "?" + new URLSearchParams(imageParams).toString();
  return fetch(url)
    .then(readWikipediaJson)
    .then(function(data) {
      var pages = data.query && data.query.pages;
      if (!pages) return null;
      var page = Object.values(pages)[0];
      if (!page || !page.imageinfo || !page.imageinfo[0] || !page.imageinfo[0].url) {
        return null;
      }
      return page.imageinfo[0].url;
    });
}

export function fetchUrsidWikitext() {
  return fetch(baseUrl + "?" + new URLSearchParams(wikitextParams).toString())
    .then(readWikipediaJson)
    .then(function(data) {
      var wikitext = data.parse && data.parse.wikitext && data.parse.wikitext['*'];
      if (!wikitext) {
        throw new Error('Wikipedia did not return the ursid list text.');
      }
      return wikitext;
    });
}
