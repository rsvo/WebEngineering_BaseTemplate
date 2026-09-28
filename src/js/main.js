import { initSearch } from './search.js';
import { initComments } from './comments.js';
import { initBears } from './bears.js';
import { showError } from './errors.js';

async function boot() {
  try {
    initSearch();
    initComments();
    await initBears();
  } catch (err) {
    showError(document.querySelector('main'), err);
  }
}

boot();
