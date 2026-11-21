import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import { createInMemoryUserRepository } from './auth/repository.js';
import { createInMemoryBearRepository } from './bears/repository.js';
import {
  createInMemoryCommentRepository,
  createInMemoryTransactor,
} from './comments/memory-repository.js';
import { loadConfig } from './config.js';

// Attack: cross-site request forgery. A page on evil.example makes the
// victim's browser create a comment, with the victim's session cookie.
// Assume SameSite failed (an old browser, or a same-site subdomain): the
// layers below must still stop it.
const ALLOWED = 'http://localhost:4173';
const EVIL = 'https://evil.example';
const COMMENTS = '/api/bears/ursus-arctos/comments';

describe('attack: cross-site POST (CSRF)', () => {
  let app: FastifyInstance;
  let cookie: string;

  beforeEach(async () => {
    const comments = createInMemoryCommentRepository();
    app = buildApp(
      {
        ...loadConfig({
          LOG_LEVEL: 'silent',
          DATABASE_URL: 'postgres://test@localhost:1/test',
          CORS_ORIGINS: ALLOWED,
        }),
        prettyLogs: false,
      },
      {
        bears: createInMemoryBearRepository([
          {
            id: 'ursus-arctos',
            name: 'Brown bear',
            binomial: 'Ursus arctos',
            range: 'Eurasia',
            imageUrl: null,
          },
        ]),
        comments,
        transaction: createInMemoryTransactor(comments),
        users: createInMemoryUserRepository(),
      }
    );
    const victim = { email: 'victim@example.org', password: 'a'.repeat(12) };
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      body: victim,
    });
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      body: victim,
    });
    cookie = String(login.headers['set-cookie']).split(';')[0] ?? '';
  });
  afterEach(async () => {
    await app.close();
  });

  it('rejects forged form posts (no preflight) before any route code runs', async () => {
    // <form enctype="text/plain"> with an input named '{"author":"M","text":"x","y":"'
    // sends a body that looks like JSON; urlencoded is the default form type.
    const forms = [
      ['text/plain', '{"author":"Mallory","text":"pwned","y":"="}'],
      ['application/x-www-form-urlencoded', 'author=Mallory&text=pwned'],
    ] as const;
    for (const [contentType, payload] of forms) {
      const response = await app.inject({
        method: 'POST',
        url: COMMENTS,
        headers: { origin: EVIL, cookie, 'content-type': contentType },
        payload,
      });
      expect(response.statusCode).toBe(415);
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    }

    const list = await app.inject(COMMENTS);
    expect(list.json<{ items: unknown[] }>().items).toEqual([]);
  });

  it('refuses the preflight of a JSON fetch from a foreign origin', async () => {
    const preflight = async (
      origin: string
    ): Promise<Record<string, unknown>> =>
      (
        await app.inject({
          method: 'OPTIONS',
          url: COMMENTS,
          headers: {
            origin,
            'access-control-request-method': 'POST',
            'access-control-request-headers': 'content-type',
          },
        })
      ).headers;

    // No allow-origin header: the browser never sends the actual POST.
    expect((await preflight(EVIL))['access-control-allow-origin']).toBe(
      undefined
    );
    expect(await preflight(ALLOWED)).toMatchObject({
      'access-control-allow-origin': ALLOWED,
      'access-control-allow-credentials': 'true',
    });
  });
});
