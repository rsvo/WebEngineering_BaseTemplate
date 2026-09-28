function hasStringMessage(value: unknown): value is { message: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as { message?: unknown }).message === 'string'
  );
}

export function messageFromError(err: unknown): string {
  if (hasStringMessage(err)) return err.message;
  return String(err);
}

export function showError(container: Element | null, err: unknown): void {
  const message = messageFromError(err);
  if (!container) {
    window.alert(message);
    return;
  }

  let el = container.querySelector<HTMLParagraphElement>('.error-message');
  if (!el) {
    el = document.createElement('p');
    el.className = 'error-message';
    el.setAttribute('role', 'alert');
    container.appendChild(el);
  }

  el.hidden = false;
  el.textContent = message;
}

export function hideError(container: Element | null): void {
  if (!container) return;
  const el = container.querySelector<HTMLParagraphElement>('.error-message');
  if (!el) return;
  el.hidden = true;
  el.textContent = '';
}
