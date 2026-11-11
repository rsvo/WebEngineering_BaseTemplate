// Errors carrying an HTTP `statusCode` are rendered by Fastify's error handler
// with that status instead of a generic 500.

export class NotFoundError extends Error {
  readonly statusCode = 404;

  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// An upstream dependency failed: 502 Bad Gateway when it was unreachable or
// answered with something unusable, 504 Gateway Timeout when it was too slow.
export class UpstreamError extends Error {
  readonly statusCode: 502 | 504;

  constructor(
    message: string,
    statusCode: 502 | 504 = 502,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'UpstreamError';
    this.statusCode = statusCode;
  }
}
