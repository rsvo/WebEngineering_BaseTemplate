import { VERSION } from './version.js';

export interface WikipediaConfig {
  apiUrl: string;
  timeoutMs: number;
  userAgent: string;
}

export interface Config {
  host: string;
  port: number;
  logLevel: string;
  prettyLogs: boolean;
  enableDebugRoutes: boolean;
  corsOrigins: readonly string[];
  wikipedia: WikipediaConfig;
  bearsCacheTtlMs: number;
}

const DEFAULT_WIKIPEDIA_API_URL = 'https://en.wikipedia.org/w/api.php';

// Wikimedia's User-Agent policy asks for a name, a version and a way to
// contact the operator, so misbehaving clients can be identified and reached
// instead of being blocked: https://foundation.wikimedia.org/wiki/Policy:User-Agent_policy
const USER_AGENT =
  `BearsPlayground/${VERSION} ` +
  '(https://github.com/rsvo/WebEngineering_BaseTemplate; ' +
  'student project, Web Engineering at Hochschule Campus Wien) ' +
  `node/${process.versions.node}`;

function readString(raw: string | undefined, fallback: string): string {
  return raw === undefined || raw.trim() === '' ? fallback : raw.trim();
}

function readInteger(
  name: string,
  raw: string | undefined,
  fallback: number,
  { min, max }: { min: number; max: number }
): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(
      `${name} must be an integer between ${min} and ${max}: "${raw}"`
    );
  }
  return value;
}

function readBoolean(
  name: string,
  raw: string | undefined,
  fallback: boolean
): boolean {
  if (raw === undefined || raw.trim() === '') return fallback;
  const value = raw.trim().toLowerCase();
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  throw new Error(`${name} must be true or false: "${raw}"`);
}

function readUrl(
  name: string,
  raw: string | undefined,
  fallback: string
): string {
  const value = readString(raw, fallback);
  if (!URL.canParse(value)) {
    throw new Error(`${name} must be an absolute URL: "${value}"`);
  }
  return value;
}

// A comma-separated list of exact origins (scheme://host[:port]). The browser
// compares the Origin header byte for byte, so "http://localhost:4173/" (with
// a slash) or a path would never match; such entries are rejected at startup.
// "*" is rejected too: only listed origins may read our responses.
function readOrigins(name: string, raw: string | undefined): string[] {
  if (raw === undefined || raw.trim() === '') return [];
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '')
    .map((entry) => {
      const origin = URL.canParse(entry) ? new URL(entry).origin : 'null';
      if (origin !== entry) {
        throw new Error(
          `${name} must list origins like "http://localhost:4173": "${entry}"`
        );
      }
      return origin;
    });
}

// Read once at startup, so a misconfigured container fails immediately instead
// of on the first request.
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    host: readString(env.HOST, '0.0.0.0'),
    port: readInteger('PORT', env.PORT, 3000, { min: 1, max: 65535 }),
    logLevel: readString(env.LOG_LEVEL, 'info'),
    prettyLogs: env.NODE_ENV !== 'production',
    enableDebugRoutes: readBoolean(
      'ENABLE_DEBUG_ROUTES',
      env.ENABLE_DEBUG_ROUTES,
      env.NODE_ENV !== 'production'
    ),
    // Empty: no cross-origin access at all. The web app does not need it, as it
    // reaches the API through a same-origin proxy (Vite in dev, nginx in Docker).
    corsOrigins: readOrigins('CORS_ORIGINS', env.CORS_ORIGINS),
    wikipedia: {
      apiUrl: readUrl(
        'WIKIPEDIA_API_URL',
        env.WIKIPEDIA_API_URL,
        DEFAULT_WIKIPEDIA_API_URL
      ),
      timeoutMs: readInteger(
        'UPSTREAM_TIMEOUT_MS',
        env.UPSTREAM_TIMEOUT_MS,
        5000,
        { min: 1, max: 60000 }
      ),
      userAgent: USER_AGENT,
    },
    bearsCacheTtlMs: readInteger(
      'BEARS_CACHE_TTL_MS',
      env.BEARS_CACHE_TTL_MS,
      5 * 60 * 1000,
      { min: 0, max: 24 * 60 * 60 * 1000 }
    ),
  };
}
