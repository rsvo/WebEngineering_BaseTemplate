import { ApiError } from '../api/client';

function hasStringMessage(value: unknown): value is { message: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as { message?: unknown }).message === 'string'
  );
}

export function messageFromError(err: unknown): string {
  // Server-side failures are not the user's fault and cannot be fixed by them;
  // the request id lets support find the matching log line.
  if (
    err instanceof ApiError &&
    err.status >= 500 &&
    err.requestId !== undefined
  ) {
    return `${err.message} (Reference: ${err.requestId})`;
  }
  if (hasStringMessage(err)) return err.message;
  return String(err);
}
