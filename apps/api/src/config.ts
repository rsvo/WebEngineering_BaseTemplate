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

// Read once at startup, so a misconfigured container fails immediately instead
// of on the first request.
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    host: readString(env.HOST, '0.0.0.0'),
    port: readInteger('PORT', env.PORT, 3000, { min: 1, max: 65535 }),
    logLevel: readString(env.LOG_LEVEL, 'info'),
    prettyLogs: env.NODE_ENV !== 'production',
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
