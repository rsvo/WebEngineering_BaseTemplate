import type { z } from 'zod';

// All requests go to the same origin; in dev Vite proxies /api, in Docker nginx.
export const API_BASE_URL = '/api';

// An HTTP error response from our API, with the status code and the message
// the API sent.
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof body.message === 'string'
    ) {
      return body.message;
    }
  } catch {
    // Not JSON (e.g. an HTML error page of a proxy); use the generic message.
  }
  return `The request failed (HTTP ${response.status}).`;
}

// Fetches a path below the API and validates the JSON response with `schema`,
// so the rest of the app only ever sees data that matches its type.
export async function getJson<T>(
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }

  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error('The server sent data in an unexpected format.');
  }
  return parsed.data;
}
