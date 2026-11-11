import { readFileSync } from 'node:fs';

// `../package.json` resolves to apps/api/package.json both from src/ (tsx) and
// from dist/ (node), so the reported version always matches the running code.
function readVersion(): string {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );
  if (
    typeof raw === 'object' &&
    raw !== null &&
    'version' in raw &&
    typeof raw.version === 'string'
  ) {
    return raw.version;
  }
  return 'unknown';
}

// Read once at startup, never per request (a synchronous read blocks the loop).
export const VERSION = readVersion();
