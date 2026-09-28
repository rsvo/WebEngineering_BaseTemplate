import { hideError, showError } from './errors';

function addComment(list: HTMLUListElement, nameValue: string, commentValue: string): void {
  const listItem = document.createElement('li');
  const namePara = document.createElement('p');
  const commentPara = document.createElement('p');

  namePara.textContent = nameValue;
  commentPara.textContent = commentValue;
  listItem.appendChild(namePara);
  listItem.appendChild(commentPara);
  list.appendChild(listItem);
}

function syncToggleLabel(showHideBtn: HTMLElement, commentWrapper: HTMLElement): void {
  showHideBtn.textContent = commentWrapper.hidden ? 'Show comments' : 'Hide comments';
}

export function initComments(): void {
  const commentsSection = document.querySelector<HTMLElement>('.comments');
  const showHideBtn = document.querySelector<HTMLElement>('.show-hide');
  const commentWrapper = document.querySelector<HTMLElement>('.comment-wrapper');
  const form = document.querySelector<HTMLFormElement>('.comment-form');
  const nameField = document.querySelector<HTMLInputElement>('#name');
  const commentField = document.querySelector<HTMLInputElement>('#comment');
  const list = document.querySelector<HTMLUListElement>('.comment-container');

  if (!commentsSection || !showHideBtn || !commentWrapper || !form || !nameField || !commentField || !list) {
    throw new Error('The comment section is missing from the page.');
  }

  syncToggleLabel(showHideBtn, commentWrapper);

  showHideBtn.addEventListener('click', () => {
    try {
      commentWrapper.hidden = !commentWrapper.hidden;
      syncToggleLabel(showHideBtn, commentWrapper);
    } catch (err) {
      showError(commentsSection, err);
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    hideError(commentsSection);

    try {
      const nameValue = nameField.value.trim();
      const commentValue = commentField.value.trim();
      if (!nameValue || !commentValue) {
        showError(commentsSection, new Error('Please enter both a name and a comment.'));
        return;
      }

      addComment(list, nameValue, commentValue);
      nameField.value = '';
      commentField.value = '';
    } catch (err) {
      showError(commentsSection, err);
    }
  });
}
