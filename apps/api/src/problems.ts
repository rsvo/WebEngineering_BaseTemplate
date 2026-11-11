import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { FastifyError, FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
  ClientError,
  HttpError,
  NotFoundError,
  ValidationError,
  type FieldError,
} from './errors.js';

export const REQUEST_ID_HEADER = 'x-request-id';
export const PROBLEM_CONTENT_TYPE = 'application/problem+json; charset=utf-8';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The one error contract of this API (RFC 9457 + our extension members). The
// ids make them named components in the OpenAPI document.
export const FieldErrorSchema = z
  .object({
    location: z
      .string()
      .describe('Part of the request: body, params, querystring or headers.'),
    pointer: z
      .string()
      .describe(
        'JSON pointer (RFC 6901) into that part, e.g. "/author"; "" for the part as a whole.'
      ),
    detail: z.string().describe('What is wrong with the value.'),
  })
  .meta({ id: 'FieldError' });

export const ProblemDetailsSchema = z
  .object({
    type: z
      .string()
      .describe(
        'URI of the problem type; "about:blank" for plain HTTP status problems.'
      ),
    title: z.string().describe('Short summary of the problem type.'),
    status: z.number().int().min(400).max(599),
    detail: z
      .string()
      .describe('Explanation of this occurrence, safe to show to users.'),
    instance: z
      .string()
      .describe('Identifies this occurrence: urn:uuid:<request id>.'),
    requestId: z.string().describe('Same as the x-request-id header.'),
    errors: z
      .array(FieldErrorSchema)
      .optional()
      .describe('Only for validation-error: every invalid field.'),
  })
  .meta({
    id: 'ProblemDetails',
    description: 'RFC 9457 Problem Details, sent as application/problem+json.',
  });

export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;

// A caller (a proxy, another service, or a client that wants to correlate its
// own logs) may pass in a request id. It is only taken over if it is a UUID:
// an arbitrary value would let clients inject text into our logs or forge ids
// that collide with other requests.
export function genReqId(req: IncomingMessage): string {
  const incoming = req.headers[REQUEST_ID_HEADER];
  if (typeof incoming === 'string' && UUID_PATTERN.test(incoming)) {
    return incoming.toLowerCase();
  }
  return randomUUID();
}

// Converts any thrown value into an HttpError. Everything not recognised as a
// client error or a deliberate HttpError is a bug: it becomes a 500 and its
// message is never sent to the client.
function toHttpError(error: unknown): HttpError | null {
  if (error instanceof HttpError) return error;

  if (typeof error !== 'object' || error === null) return null;
  const fastifyError = error as Partial<FastifyError>;

  // Request validation failed (zod schemas of params, querystring or body).
  if (Array.isArray(fastifyError.validation)) {
    const location = fastifyError.validationContext ?? 'request';
    return new ValidationError(
      fastifyError.validation.map((issue): FieldError => ({
        location,
        pointer: issue.instancePath === '/' ? '' : issue.instancePath,
        detail: issue.message ?? 'is invalid',
      }))
    );
  }

  // Errors Fastify raises about the request itself: malformed JSON (400),
  // unsupported media type (415), body too large (413), ... Their messages
  // only describe the client's own input, so they are safe to pass on.
  const status = fastifyError.statusCode;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return new ClientError(status, fastifyError.message ?? 'Bad request.');
  }

  return null;
}

function internalServerError(statusCode: unknown): {
  status: number;
  title: string;
} {
  // Keep a deliberate 5xx status (e.g. 503 from a plugin), but never its text.
  const status =
    typeof statusCode === 'number' && statusCode >= 500 && statusCode < 600
      ? statusCode
      : 500;
  return {
    status,
    title: status === 500 ? 'Internal Server Error' : 'Server Error',
  };
}

function toProblem(error: unknown, request: FastifyRequest): ProblemDetails {
  const base = {
    // urn:uuid: makes the request id a valid URI, as RFC 9457 requires for
    // `instance`, and identifies exactly this occurrence of the problem.
    instance: `urn:uuid:${request.id}`,
    requestId: request.id,
  };

  const httpError = toHttpError(error);
  if (httpError === null) {
    const { status, title } = internalServerError(
      (error as Partial<FastifyError> | null)?.statusCode
    );
    return {
      type: 'about:blank',
      title,
      status,
      detail:
        'An unexpected error occurred. Please quote the request id when reporting this problem.',
      ...base,
    };
  }

  return {
    type: httpError.type,
    title: httpError.title,
    status: httpError.status,
    detail: httpError.message,
    ...base,
    ...httpError.extensions(),
  };
}

export function registerProblemDetails(app: FastifyInstance): void {
  // Set before anything else runs, so every response carries the id: success,
  // problem, 404, and responses of routes that fail in a hook.
  app.addHook('onRequest', async (request, reply) => {
    void reply.header(REQUEST_ID_HEADER, request.id);
  });

  app.setErrorHandler(async (error, request, reply) => {
    const problem = toProblem(error, request);

    // The full error, including stack trace and cause, goes to the log only.
    // Client errors are expected and logged at info, server errors at error.
    if (problem.status >= 500) {
      request.log.error({ err: error, problem }, 'request failed');
    } else {
      request.log.info({ problem }, 'request rejected');
    }

    return await reply
      .code(problem.status)
      .type(PROBLEM_CONTENT_TYPE)
      .send(problem);
  });

  app.setNotFoundHandler(async (request) => {
    const path = request.url.split('?')[0] ?? request.url;
    throw new NotFoundError(`There is no route for ${request.method} ${path}.`);
  });
}
