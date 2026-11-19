import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';
import { createInMemoryBearRepository } from './bears/repository.js';
import type { Bear } from './bears/schema.js';
import { loadConfig } from './config.js';
import {
  createInMemoryCommentRepository,
  createInMemoryTransactor,
} from './comments/memory-repository.js';
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
      transaction: createInMemoryTransactor(comments),
    });
  });
  afterEach(async () => {
    await app.close();
  });

  it('counts 50 concurrent reports exactly and hides at 3', async () => {
    const { id } = await comments.create('ursus-arctos', {
      author: 'Ann',
      text: 'Spam',
    });
    const url = `/api/comments/${id}/report`;

    const responses = await Promise.all(
      Array.from({ length: 50 }, async () => {
        return await app.inject({ method: 'POST', url });
      })
    );
    // Every request saw a different count: none of them got lost.
    const counts = responses.map(
      (response) => response.json<{ reportCount: number }>().reportCount
    );
    assert.deepEqual(
      counts.sort((a, b) => a - b),
      Array.from({ length: 50 }, (_, i) => i + 1)
    );
    const state = await comments.findReportState(id, { lock: false });
    assert.equal(state?.reportCount, 50);

    // Hidden: no longer readable or listed, but still reportable.
    assert.equal((await app.inject(`/api/comments/${id}`)).statusCode, 404);
    const list = await app.inject('/api/bears/ursus-arctos/comments');
    assert.deepEqual(list.json<{ items: unknown[] }>().items, []);

    const unknown = await app.inject({
      method: 'POST',
      url: '/api/comments/00000000-0000-4000-8000-000000000000/report',
    });
    assert.equal(unknown.statusCode, 404);
  });

  it('lists bears and 404s unknown ones', async () => {
    const list = await app.inject('/api/bears');
    assert.equal(list.statusCode, 200);
    assert.deepEqual(list.json(), BEARS);

    const missing = await app.inject('/api/bears/ursus-nope');
    assert.equal(missing.statusCode, 404);
    assert.match(missing.headers['content-type'] ?? '', /problem\+json/);
  });

  it('filters bears by name with ?q=', async () => {
    const polar = await app.inject('/api/bears?q=POLAR');
    assert.deepEqual(polar.json(), [BEARS[1]]);
    assert.deepEqual((await app.inject('/api/bears?q=koala')).json(), []);
    assert.deepEqual((await app.inject('/api/bears?q=')).json(), BEARS);
  });

  it('pages through comments with a cursor, newest first', async () => {
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) {
      const comment = await comments.create('ursus-arctos', {
        author: 'Ann',
        text: `#${i}`,
      });
      ids.push(comment.id);
    }
    // Same-millisecond timestamps are fine: id breaks the tie.
    const all = (await comments.listByBear('ursus-arctos', { limit: 10 }))
      .items;

    const seen: string[] = [];
    let cursor: string | null = null;
    do {
      const query: string = cursor === null ? '' : `&cursor=${cursor}`;
      const response = await app.inject(
        `/api/bears/ursus-arctos/comments?limit=2${query}`
      );
      assert.equal(response.statusCode, 200);
      const page = response.json<{
        items: Array<{ id: string }>;
        nextCursor: string | null;
      }>();
      assert.ok(page.items.length <= 2);
      seen.push(...page.items.map((item) => item.id));
      cursor = page.nextCursor;
    } while (cursor !== null);

    assert.deepEqual(
      seen,
      all.map((comment) => comment.id)
    );
    assert.deepEqual([...seen].sort(), [...ids].sort());

    const bad = await app.inject('/api/bears/ursus-arctos/comments?cursor=x');
    assert.equal(bad.statusCode, 400);
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
      list.json<{ items: Array<{ id: string }> }>().items.map((c) => c.id),
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
    comments.listByBear = async (bearId, page) => {
      calls.listByBear++;
      return await listByBear(bearId, page);
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
