import { z } from 'zod';

// All requests go to the same origin; in dev Vite proxies /api, in Docker nginx.
export const API_BASE_URL = '/api';

const REQUEST_ID_HEADER = 'x-request-id';

const FieldErrorSchema = z.object({
  location: z.string(),
  pointer: z.string(),
  detail: z.string(),
});

export type FieldError = z.infer<typeof FieldErrorSchema>;

// RFC 9457 Problem Details as sent by our API. Every member is optional in the
// RFC, so the schema is lenient: whatever is usable is used.
const ProblemSchema = z.object({
  type: z.string().optional(),
  title: z.string().optional(),
  status: z.number().optional(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  requestId: z.string().optional(),
  errors: z.array(FieldErrorSchema).optional(),
});

type Problem = z.infer<typeof ProblemSchema>;

// An HTTP error response from our API. `message` is the problem's `detail`,
// which is written for humans and safe to show.
export class ApiError extends Error {
  readonly status: number;
  readonly title: string | undefined;
  readonly requestId: string | undefined;
  readonly errors: readonly FieldError[];

  constructor(status: number, problem: Problem, requestId: string | undefined) {
    super(
      problem.detail ?? problem.title ?? `The request failed (HTTP ${status}).`
    );
    this.name = 'ApiError';
    this.status = status;
    this.title = problem.title;
    this.requestId = problem.requestId ?? requestId;
    this.errors = problem.errors ?? [];
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

async function toApiError(response: Response): Promise<ApiError> {
  // Also set on responses that are not problems, e.g. when a proxy in front
  // of the API rewrote the body.
  const requestId = response.headers.get(REQUEST_ID_HEADER) ?? undefined;

  let problem: Problem = {};
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('json')) {
    try {
      const parsed = ProblemSchema.safeParse(await response.json());
      if (parsed.success) problem = parsed.data;
    } catch {
      // Broken JSON: fall back to the generic message.
    }
  }
  // Anything else (e.g. an HTML error page of a proxy) gets the generic message.
  return new ApiError(response.status, problem, requestId);
}

async function send(
  path: string,
  { method = 'GET', body, signal }: RequestOptions
): Promise<Response> {
  const headers: Record<string, string> = {
    accept: 'application/json, application/problem+json',
  };
  if (body !== undefined) headers['content-type'] = 'application/json';

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  if (!response.ok) throw await toApiError(response);
  return response;
}

// Sends a request below the API and validates the JSON response with `schema`,
// so the rest of the app only ever sees data that matches its type.
export async function requestJson<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestOptions = {}
): Promise<T> {
  const response = await send(path, options);
  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error('The server sent data in an unexpected format.');
  }
  return parsed.data;
}

// For responses without a body, such as 204 No Content.
export async function requestNoContent(
  path: string,
  options: RequestOptions = {}
): Promise<void> {
  await send(path, options);
}

export async function getJson<T>(
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal
): Promise<T> {
  return await requestJson(path, schema, { signal });
}
