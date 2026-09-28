import { hideError, showError } from './errors';

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'FORM', 'MARK']);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function clearHighlights(root: Element): void {
  root.querySelectorAll<HTMLElement>('.highlight').forEach((el) => {
    const parent = el.parentNode;
    if (parent === null) return;
    parent.replaceChild(document.createTextNode(el.textContent ?? ''), el);
    parent.normalize();
  });
}

function highlightTextNode(textNode: Text, regex: RegExp): void {
  const text = textNode.nodeValue;
  if (text === null) return;

  regex.lastIndex = 0;
  if (!regex.test(text)) return;

  regex.lastIndex = 0;
  const fragment = document.createDocumentFragment();
  let lastIndex = 0;
  let match = regex.exec(text);

  while (match !== null) {
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

function highlightMatches(root: Node, regex: RegExp): void {
  const walk = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      highlightTextNode(node as Text, regex);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || SKIP_TAGS.has((node as Element).tagName)) return;
    Array.from(node.childNodes).forEach(walk);
  };

  walk(root);
}

export function initSearch(): void {
  const form = document.querySelector<HTMLFormElement>('.search');
  if (form === null) {
    throw new Error('The search form is missing from the page.');
  }

  const queryField = form.elements.namedItem('q');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    hideError(form);

    try {
      const article = document.querySelector<HTMLElement>('article');
      if (article === null) {
        throw new Error('The article content is missing, so search cannot highlight anything.');
      }

      clearHighlights(article);

      const searchKey = queryField instanceof HTMLInputElement ? queryField.value.trim() : '';
      if (searchKey.length === 0) return;

      highlightMatches(article, new RegExp('(' + escapeRegExp(searchKey) + ')', 'gi'));
    } catch (err) {
      showError(form, err);
    }
  });
}
