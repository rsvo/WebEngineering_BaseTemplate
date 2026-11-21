import { STATUS_CODES } from 'node:http';

// RFC 9457 problem types. Generic HTTP problems use "about:blank", whose title
// is the HTTP status phrase. Problems with their own semantics (or extension
// members) get their own type URI: absolute, stable, and dereferenceable to
// human-readable documentation (the README's "Problem types" section).
const PROBLEM_TYPE_DOCS =
  'https://github.com/rsvo/WebEngineering_BaseTemplate/blob/playground-4/README.md#problem-type-';

export const PROBLEM_TYPES = {
  'validation-error': {
    status: 400,
    title: 'Your request is not valid.',
  },
  'upstream-unavailable': {
    status: 502,
    title: 'An upstream service is unavailable.',
  },
  'upstream-timeout': {
    status: 504,
    title: 'An upstream service did not respond in time.',
  },
} as const;

export type ProblemSlug = keyof typeof PROBLEM_TYPES;

export function problemTypeUri(slug: ProblemSlug): string {
  return `${PROBLEM_TYPE_DOCS}${slug}`;
}

export interface FieldError {
  // Which part of the request: "body", "params", "querystring" or "headers".
  location: string;
  // JSON pointer (RFC 6901) into that part, e.g. "/author" ("" = the whole part).
  pointer: string;
  detail: string;
}

interface HttpErrorOptions extends ErrorOptions {
  type?: string;
  title?: string;
}

// Base class for every error whose message may be shown to the client: the
// message becomes the problem's `detail`. Anything that is not an HttpError is
// treated as a bug and rendered as a generic 500 without any details.
export abstract class HttpError extends Error {
  abstract readonly status: number;
  readonly type: string;
  private readonly customTitle: string | undefined;

  constructor(detail: string, options: HttpErrorOptions = {}) {
    const { type = 'about:blank', title, ...errorOptions } = options;
    super(detail, errorOptions);
    this.type = type;
    this.customTitle = title;
  }

  // For "about:blank" the title is the HTTP status phrase (RFC 9457, 4.2.1).
  get title(): string {
    return this.customTitle ?? STATUS_CODES[this.status] ?? 'Error';
  }

  // Additional RFC 9457 members for this problem type.
  extensions(): Record<string, unknown> {
    return {};
  }
}

// An error with its own documented problem type (see PROBLEM_TYPES).
abstract class TypedHttpError extends HttpError {
  constructor(slug: ProblemSlug, detail: string, options?: ErrorOptions) {
    super(detail, {
      ...options,
      type: problemTypeUri(slug),
      title: PROBLEM_TYPES[slug].title,
    });
  }
}

export class ValidationError extends TypedHttpError {
  readonly status = 400;
  readonly errors: readonly FieldError[];

  constructor(errors: readonly FieldError[]) {
    super(
      'validation-error',
      errors.length === 1
        ? 'The request has 1 invalid field.'
        : `The request has ${errors.length} invalid fields.`
    );
    this.name = 'ValidationError';
    this.errors = errors;
  }

  override extensions(): Record<string, unknown> {
    return { errors: this.errors };
  }
}

// A client error detected by Fastify itself, e.g. malformed JSON (400), an
// unsupported content type (415) or a body that is too large (413).
export class ClientError extends HttpError {
  readonly status: number;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'ClientError';
    this.status = status;
  }
}

export class UnauthorizedError extends HttpError {
  readonly status = 401;

  constructor(detail: string) {
    super(detail);
    this.name = 'UnauthorizedError';
  }
}

// Logged in, but not allowed to do this.
export class ForbiddenError extends HttpError {
  readonly status = 403;

  constructor(detail: string) {
    super(detail);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends HttpError {
  readonly status = 404;

  constructor(detail: string) {
    super(detail);
    this.name = 'NotFoundError';
  }
}

// The request clashes with the current state, e.g. an e-mail already in use.
export class ConflictError extends HttpError {
  readonly status = 409;

  constructor(detail: string) {
    super(detail);
    this.name = 'ConflictError';
  }
}

// A dependency this instance needs (the database) is not available.
export class ServiceUnavailableError extends HttpError {
  readonly status = 503;

  constructor(detail: string, options?: ErrorOptions) {
    super(detail, options);
    this.name = 'ServiceUnavailableError';
  }
}

// Wikipedia was unreachable or answered with something unusable.
export class UpstreamUnavailableError extends TypedHttpError {
  readonly status = 502;

  constructor(detail: string, options?: ErrorOptions) {
    super('upstream-unavailable', detail, options);
    this.name = 'UpstreamUnavailableError';
  }
}

// Wikipedia did not answer within the timeout.
export class UpstreamTimeoutError extends TypedHttpError {
  readonly status = 504;

  constructor(detail: string, options?: ErrorOptions) {
    super('upstream-timeout', detail, options);
    this.name = 'UpstreamTimeoutError';
  }
}
