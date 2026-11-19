import { z } from 'zod';
import { VERSION } from './version.js';

export interface WikipediaConfig {
  apiUrl: string;
  timeoutMs: number;
  userAgent: string;
}

export interface DatabaseConfig {
  url: string;
  poolMax: number;
}

export interface Config {
  host: string;
  port: number;
  logLevel: string;
  prettyLogs: boolean;
  enableDebugRoutes: boolean;
  corsOrigins: readonly string[];
  database: DatabaseConfig;
  wikipedia: WikipediaConfig;
}

// Wikimedia's User-Agent policy asks for a name, a version and a way to
// contact the operator, so misbehaving clients can be identified and reached
// instead of being blocked: https://foundation.wikimedia.org/wiki/Policy:User-Agent_policy
const USER_AGENT =
  `BearsPlayground/${VERSION} ` +
  '(https://github.com/rsvo/WebEngineering_BaseTemplate; ' +
  'student project, Web Engineering at Hochschule Campus Wien) ' +
  `node/${process.versions.node}`;

const int = (min: number, max: number): z.ZodCoercedNumber<unknown> =>
  z.coerce.number().int().min(min).max(max);

// The browser compares the Origin header byte for byte, so "http://x:4173/"
// (trailing slash) or a path would never match; "*" is not an origin either.
const OriginSchema = z
  .string()
  .refine(
    (value) => URL.canParse(value) && new URL(value).origin === value,
    'must be an origin like "http://localhost:4173"'
  );

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: int(1, 65535).default(3000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
    error: 'must be a URL like postgres://user:password@host:5432/db',
  }),
  DATABASE_POOL_MAX: int(1, 100).default(10),
  WIKIPEDIA_API_URL: z.url().default('https://en.wikipedia.org/w/api.php'),
  UPSTREAM_TIMEOUT_MS: int(1, 60_000).default(5000),

  ENABLE_DEBUG_ROUTES: z.stringbool().optional(),
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry !== '')
    )
    .pipe(z.array(OriginSchema)),
});

// Validated once at startup, so a misconfigured container fails immediately
// with every problem listed, instead of on the first request.
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  // Compose passes unset variables as "", which means "use the default".
  const present = Object.fromEntries(
    Object.entries(env).filter(([, value]) => value?.trim() !== '')
  );
  const parsed = EnvSchema.safeParse(present);
  if (!parsed.success) {
    // Only names and messages, never the values: DATABASE_URL has a password.
    throw new Error(`Invalid environment:\n${z.prettifyError(parsed.error)}`);
  }
  const e = parsed.data;
  const production = e.NODE_ENV === 'production';

  return {
    host: e.HOST,
    port: e.PORT,
    logLevel: e.LOG_LEVEL,
    prettyLogs: !production,
    enableDebugRoutes: e.ENABLE_DEBUG_ROUTES ?? !production,
    // Empty: no cross-origin access at all. The web app does not need it, as it
    // reaches the API through a same-origin proxy (Vite in dev, nginx in Docker).
    corsOrigins: e.CORS_ORIGINS,
    database: { url: e.DATABASE_URL, poolMax: e.DATABASE_POOL_MAX },
    wikipedia: {
      apiUrl: e.WIKIPEDIA_API_URL,
      timeoutMs: e.UPSTREAM_TIMEOUT_MS,
      userAgent: USER_AGENT,
    },
  };
}
