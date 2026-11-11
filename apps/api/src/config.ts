export interface Config {
  host: string;
  port: number;
  logLevel: string;
  prettyLogs: boolean;
}

function readPort(raw: string | undefined): number {
  if (raw === undefined || raw === '') return 3000;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be an integer between 1 and 65535: "${raw}"`);
  }
  return port;
}

// Read once at startup, so a misconfigured container fails immediately instead
// of on the first request.
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    host: env.HOST ?? '0.0.0.0',
    port: readPort(env.PORT),
    logLevel: env.LOG_LEVEL ?? 'info',
    prettyLogs: env.NODE_ENV !== 'production',
  };
}
