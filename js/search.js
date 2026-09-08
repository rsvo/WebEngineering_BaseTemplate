import { hideError, showError } from './errors.js';

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'FORM', 'MARK']);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function clearHighlights(root) {
  root.querySelectorAll('.highlight').forEach((el) => {
    const parent = el.parentNode;
    if (!parent) return;
    parent.replaceChild(document.createTextNode(el.textContent), el);
    parent.normalize();
  });
}

function highlightTextNode(textNode, regex) {
  const text = textNode.nodeValue;
  regex.lastIndex = 0;
  if (!regex.test(text)) return;

  regex.lastIndex = 0;
  const fragment = document.createDocumentFragment();
  let lastIndex = 0;
  let match = regex.exec(text);

  while (match) {
    if (match[0] === '') break;
    if (match.index > lastIndex) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
    }
    const mark = document.createElement('mark');
    mark.className = 'highlight';
    mark.textContent = match[0];
    fragment.appendChild(mark);
    lastIndex = regex.lastIndex;
    match = regex.exec(text);
  }

  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
  }

  textNode.replaceWith(fragment);
}

function highlightMatches(root, regex) {
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      highlightTextNode(node, regex);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || SKIP_TAGS.has(node.tagName)) return;
    Array.from(node.childNodes).forEach(walk);
  };

  walk(root);
}

export function initSearch() {
  const form = document.querySelector('.search');
  if (!form) {
    throw new Error('The search form is missing from the page.');
  }

  const queryField = form.elements.namedItem('q');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    hideError(form);

    try {
      const article = document.querySelector('article');
      if (!article) {
        throw new Error('The article content is missing, so search cannot highlight anything.');
      }

      clearHighlights(article);

      const searchKey = queryField && queryField.value ? queryField.value.trim() : '';
      if (!searchKey) return;

      highlightMatches(article, new RegExp('(' + escapeRegExp(searchKey) + ')', 'gi'));
    } catch (err) {
      showError(form, err);
    }
  });
}
