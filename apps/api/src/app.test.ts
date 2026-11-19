import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';
import { createInMemoryBearRepository } from './bears/repository.js';
import type { Bear } from './bears/schema.js';
import { loadConfig } from './config.js';
import { createInMemoryCommentRepository } from './comments/memory-repository.js';
import type { CommentRepository } from './comments/repository.js';

// Runs against the in-memory repositories: no database, no network. The URL
// only satisfies config validation; the lazy pool never connects.
const config = {
  ...loadConfig({
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    DATABASE_URL: 'postgres://test@localhost:1/test',
  }),
  prettyLogs: false,
};

const BEARS: Bear[] = [
  {
    id: 'ursus-arctos',
    name: 'Brown bear',
    binomial: 'Ursus arctos',
    range: 'Eurasia and North America',
    imageUrl: null,
  },
  {
    id: 'ursus-maritimus',
    name: 'Polar bear',
    binomial: 'Ursus maritimus',
    range: 'Arctic',
    imageUrl: null,
  },
];

describe('bears and comments API', () => {
  let app: FastifyInstance;
  let comments: CommentRepository;

  beforeEach(() => {
    comments = createInMemoryCommentRepository();
    app = buildApp(config, {
      bears: createInMemoryBearRepository(BEARS),
      comments,
    });
  });
  afterEach(async () => {
    await app.close();
  });

  it('lists bears and 404s unknown ones', async () => {
    const list = await app.inject('/api/bears');
    assert.equal(list.statusCode, 200);
    assert.deepEqual(list.json(), BEARS);

    const missing = await app.inject('/api/bears/ursus-nope');
    assert.equal(missing.statusCode, 404);
    assert.match(missing.headers['content-type'] ?? '', /problem\+json/);
  });

  it('creates, lists and deletes a comment', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/bears/ursus-arctos/comments',
      payload: { author: ' Ann ', text: 'Big!' },
    });
    assert.equal(created.statusCode, 201);
    const { id, author } = created.json<{ id: string; author: string }>();
    assert.equal(author, 'Ann');
    assert.equal(created.headers.location, `/api/comments/${id}`);

    const list = await app.inject('/api/bears/ursus-arctos/comments');
    assert.deepEqual(
      list.json<Array<{ id: string }>>().map((comment) => comment.id),
      [id]
    );

    const url = `/api/comments/${id}`;
    assert.equal((await app.inject({ method: 'DELETE', url })).statusCode, 204);
    // Idempotent: the state stays the same, only the answer differs.
    assert.equal((await app.inject({ method: 'DELETE', url })).statusCode, 404);
  });

  it('rejects invalid comments and unknown bears', async () => {
    const invalid = await app.inject({
      method: 'POST',
      url: '/api/bears/ursus-arctos/comments',
      payload: { author: '', text: 'x' },
    });
    assert.equal(invalid.statusCode, 400);
    assert.equal(invalid.json<{ errors: unknown[] }>().errors.length, 1);

    const unknownBear = await app.inject({
      method: 'POST',
      url: '/api/bears/ursus-nope/comments',
      payload: { author: 'Ann', text: 'Hi' },
    });
    assert.equal(unknownBear.statusCode, 404);
  });

  it('loads the comments of all bears in one call, not one per bear', async () => {
    await comments.create('ursus-maritimus', { author: 'Ann', text: 'Cold' });
    const calls = { listByBear: 0, listByBears: 0 };
    const { listByBear, listByBears } = comments;
    comments.listByBear = async (bearId) => {
      calls.listByBear++;
      return await listByBear(bearId);
    };
    comments.listByBears = async (bearIds) => {
      calls.listByBears++;
      return await listByBears(bearIds);
    };

    const response = await app.inject('/api/comments');
    assert.equal(response.statusCode, 200);
    const body = response.json<Record<string, unknown[]>>();
    assert.deepEqual(Object.keys(body), ['ursus-arctos', 'ursus-maritimus']);
    assert.equal(body['ursus-maritimus']?.length, 1);
    assert.deepEqual(calls, { listByBear: 0, listByBears: 1 });
  });
});
