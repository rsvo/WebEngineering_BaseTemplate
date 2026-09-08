import { hideError, showError } from './errors.js';

export function initComments() {
  var commentsSection = document.querySelector('.comments');
  var showHideBtn = document.querySelector('.show-hide');
  var commentWrapper = document.querySelector('.comment-wrapper');
  var form = document.querySelector('.comment-form');
  var nameField = document.querySelector('#name');
  var commentField = document.querySelector('#comment');
  var list = document.querySelector('.comment-container');
  var commentsVisible = false;

  if (!commentsSection || !showHideBtn || !commentWrapper || !form || !nameField || !commentField || !list) {
    throw new Error('The comment section is missing from the page.');
  }

  commentWrapper.style.display = 'none';

  showHideBtn.addEventListener('click', () => {
    try {
      commentsVisible = !commentsVisible;
      commentWrapper.style.display = commentsVisible ? 'block' : 'none';
      showHideBtn.textContent = commentsVisible ? 'Hide comments' : 'Show comments';
    } catch (err) {
      showError(commentsSection, err);
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    hideError(commentsSection);

    try {
      var nameValue = nameField.value.trim();
      var commentValue = commentField.value.trim();
      if (!nameValue || !commentValue) {
        showError(commentsSection, new Error('Please enter both a name and a comment.'));
        return;
      }

      var listItem = document.createElement('li');
      var namePara = document.createElement('p');
      var commentPara = document.createElement('p');

      namePara.textContent = nameValue;
      commentPara.textContent = commentValue;

      list.appendChild(listItem);
      listItem.appendChild(namePara);
      listItem.appendChild(commentPara);

      nameField.value = '';
      commentField.value = '';
    } catch (err) {
      showError(commentsSection, err);
    }
  });
}
