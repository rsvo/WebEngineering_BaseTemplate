import { initSearch } from './search';
import { initComments } from './comments';
import { initBears } from './bears';
import { showError } from './errors';

async function boot(): Promise<void> {
  try {
    initSearch();
    initComments();
    await initBears();
  } catch (err) {
    showError(document.querySelector('main'), err);
  }
}

void boot();
