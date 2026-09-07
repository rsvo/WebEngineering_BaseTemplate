export function initComments() {
  var showHideBtn = document.querySelector('.show-hide');
  var commentWrapper = document.querySelector('.comment-wrapper');
  var commentsVisible = false;

  commentWrapper.style.display = 'none';

  showHideBtn.addEventListener('click', function() {
    commentsVisible = !commentsVisible;
    commentWrapper.style.display = commentsVisible ? 'block' : 'none';
    showHideBtn.textContent = commentsVisible ? 'Hide comments' : 'Show comments';
  });

  var form = document.querySelector('.comment-form');
  var nameField = document.querySelector('#name');
  var commentField = document.querySelector('#comment');
  var list = document.querySelector('.comment-container');

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    var nameValue = nameField.value.trim();
    var commentValue = commentField.value.trim();
    if (!nameValue || !commentValue) return;

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
  });
}
