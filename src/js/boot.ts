import { initSearch } from './search';
import { initComments } from './comments';
import { showError } from './errors';

export function boot(): void {
  try {
    initSearch();
    initComments();
  } catch (err) {
    showError(document.querySelector('main'), err);
  }
}
