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
  return fetch(url).then(function(res) {
    return res.json();
  }).then(function(data) {
    var pages = data.query && data.query.pages;
    if (!pages) return null;
    var page = Object.values(pages)[0];
    if (!page || !page.imageinfo || !page.imageinfo[0]) return null;
    return page.imageinfo[0].url;
  });
}

export function fetchUrsidWikitext() {
  return fetch(baseUrl + "?" + new URLSearchParams(wikitextParams).toString())
    .then(function(res) { return res.json(); })
    .then(function(data) {
      return data.parse.wikitext['*'];
    });
}
