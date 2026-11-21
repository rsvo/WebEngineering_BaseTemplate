import { STATUS_CODES } from 'node:http';
import fastifySwagger, {
  type SwaggerTransform,
  type SwaggerTransformObject,
} from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';
import {
  jsonSchemaTransform,
  jsonSchemaTransformObject,
} from 'fastify-type-provider-zod';
import { ProblemDetailsSchema, REQUEST_ID_HEADER } from './problems.js';
import { VERSION } from './version.js';

export const DOCS_PREFIX = '/api/docs';

type JsonSchema = Record<string, unknown>;

// What can go wrong on a route, documented next to its success response.
// Fastify also uses these schemas to serialize the problem, so an error
// response that broke the contract would be caught like any other response.
export function problemResponses<const S extends readonly number[]>(
  ...statuses: S
): Record<S[number], typeof ProblemDetailsSchema> {
  return Object.fromEntries(
    statuses.map((status) => [status, ProblemDetailsSchema])
  ) as Record<S[number], typeof ProblemDetailsSchema>;
}

const RESPONSE_HEADERS: Record<string, JsonSchema> = {
  [REQUEST_ID_HEADER]: {
    type: 'string',
    format: 'uuid',
    description:
      'Id of this request; it is also in every log line of the request. Quote it when reporting a problem.',
  },
};

const LOCATION_HEADER: Record<string, JsonSchema> = {
  location: {
    type: 'string',
    format: 'uri-reference',
    description: 'URL of the created resource, if it has one of its own.',
  },
};

const PROBLEM_DESCRIPTIONS: Record<number, string> = {
  400: 'Bad Request: the input is invalid (problem type validation-error, with `errors`) or the body is not valid JSON.',
  404: 'Not Found: the bear or comment does not exist.',
  409: 'Conflict: the request clashes with existing data, e.g. an e-mail address that is already registered.',
  500: 'Internal Server Error: an unexpected error; details are only in the log, under the request id.',
  502: 'Bad Gateway: Wikipedia is unreachable or answered with something unusable (problem type upstream-unavailable).',
  504: 'Gateway Timeout: Wikipedia did not answer in time (problem type upstream-timeout).',
  503: 'Service Unavailable: the database is not reachable.',
};

// The zod transform turns every response schema into plain JSON Schema, which
// @fastify/swagger would document as application/json with the description
// "Default Response". This wrapper documents errors with their real media type
// (application/problem+json), and adds descriptions and response headers.
function describeResponse(statusKey: string, schema: JsonSchema): JsonSchema {
  const status = Number(statusKey);
  const headers = {
    ...RESPONSE_HEADERS,
    ...(status === 201 ? LOCATION_HEADER : {}),
  };

  // No body, e.g. 204 No Content.
  if (schema.type === 'null') {
    return { ...schema, description: STATUS_CODES[status], headers };
  }

  const isProblem = status >= 400;
  return {
    description: isProblem
      ? (PROBLEM_DESCRIPTIONS[status] ?? STATUS_CODES[status])
      : STATUS_CODES[status],
    headers,
    content: {
      [isProblem ? 'application/problem+json' : 'application/json']: {
        schema,
      },
    },
  };
}

const transform: SwaggerTransform = (input) => {
  const result = jsonSchemaTransform(input);
  const schema = result.schema as { response?: Record<string, JsonSchema> };
  if (schema.response !== undefined) {
    for (const [status, responseSchema] of Object.entries(schema.response)) {
      schema.response[status] = describeResponse(status, responseSchema);
    }
  }
  return result;
};

// fastify-type-provider-zod emits every registered schema twice, as input
// ("BearInput") and output ("Bear") variant. Only the ones a route actually
// references are kept, so the documentation lists exactly the API's types.
// The `schemas` object was freshly created by jsonSchemaTransformObject, so it
// can be pruned in place.
function pruneUnreferencedSchemas(
  document: ReturnType<SwaggerTransformObject>
): ReturnType<SwaggerTransformObject> {
  if (!('components' in document)) return document;
  const schemas: Record<string, unknown> | undefined =
    document.components?.schemas;
  if (schemas === undefined) return document;

  const refsIn = (value: unknown): string[] =>
    [
      ...JSON.stringify(value ?? null).matchAll(
        /"#\/components\/schemas\/([^"]+)"/g
      ),
    ].map((match) => match[1] ?? '');

  const used = new Set<string>();
  const pending = refsIn(document.paths);
  for (let name = pending.pop(); name !== undefined; name = pending.pop()) {
    if (used.has(name)) continue;
    used.add(name);
    pending.push(...refsIn(schemas[name]));
  }

  for (const name of Object.keys(schemas)) {
    if (!used.has(name)) Reflect.deleteProperty(schemas, name);
  }
  return document;
}

const transformObject: SwaggerTransformObject = (input) =>
  pruneUnreferencedSchemas(jsonSchemaTransformObject(input));

// Must be registered before the routes: @fastify/swagger collects them with an
// onRoute hook.
export function registerOpenApi(app: FastifyInstance): void {
  void app.register(fastifySwagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Bears API',
        version: VERSION,
        description:
          'Backend for frontend of the Bears web app. Every error is an RFC 9457 Problem Details object (`application/problem+json`), and every response carries an `x-request-id` header.',
      },
      tags: [
        { name: 'bears', description: 'Bears from Wikipedia, normalised' },
        { name: 'comments', description: 'Comments on bears (in memory)' },
        { name: 'auth', description: 'Accounts' },
        { name: 'operations', description: 'Health and diagnostics' },
      ],
    },
    transform,
    transformObject,
  });

  void app.register(fastifySwaggerUi, { routePrefix: DOCS_PREFIX });
}
