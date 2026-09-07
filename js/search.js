import { hideError, showError } from './errors.js';

export function initSearch() {
  var form = document.querySelector('.search');
  if (!form) {
    throw new Error('The search form is missing from the page.');
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    hideError(form);

    try {
      var article = document.querySelector('article');
      if (!article) {
        throw new Error('The article content is missing, so search cannot highlight anything.');
      }

      article.querySelectorAll('.highlight').forEach(function(el) {
        var parent = el.parentNode;
        parent.replaceChild(document.createTextNode(el.textContent), el);
        parent.normalize();
      });

      var searchKey = this.q.value.trim();
      if (!searchKey) return;

      var regex = new RegExp('(' + searchKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');

      function walk(node) {
        if (node.nodeType === 3) {
          var match = node.nodeValue.match(regex);
          if (match) {
            var span = document.createElement('span');
            span.innerHTML = node.nodeValue.replace(regex, '<mark class="highlight">$1</mark>');
            var replacements = Array.prototype.slice.call(span.childNodes);
            node.replaceWith.apply(node, replacements);
          }
        } else if (node.nodeType === 1) {
          var tag = node.tagName;
          if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'FORM' || tag === 'MARK') return;
          Array.prototype.slice.call(node.childNodes).forEach(walk);
        }
      }

      walk(article);
    } catch (err) {
      showError(form, err);
    }
  });
}
