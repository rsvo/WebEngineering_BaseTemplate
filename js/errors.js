export function messageFromError(err) {
  if (err && err.message) return err.message;
  return String(err);
}

export function showError(container, err) {
  const message = messageFromError(err);
  if (!container) {
    window.alert(message);
    return;
  }

  let el = container.querySelector('.error-message');
  if (!el) {
    el = document.createElement('p');
    el.className = 'error-message';
    el.setAttribute('role', 'alert');
    container.appendChild(el);
  }

  el.hidden = false;
  el.textContent = message;
}

export function hideError(container) {
  if (!container) return;
  const el = container.querySelector('.error-message');
  if (!el) return;
  el.hidden = true;
  el.textContent = '';
}
