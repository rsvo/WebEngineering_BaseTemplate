import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { buildApp } from '../app.js';
import { loadConfig } from '../config.js';
import {
  createInMemoryUserRepository,
  type UserRepository,
} from './repository.js';

const config = {
  ...loadConfig({
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    DATABASE_URL: 'postgres://test@localhost:1/test',
  }),
  prettyLogs: false,
};

describe('registration', () => {
  let app: FastifyInstance;
  let users: UserRepository;

  beforeEach(() => {
    users = createInMemoryUserRepository();
    app = buildApp(config, { users });
  });
  afterEach(async () => {
    await app.close();
  });

  const register = async (
    body: Record<string, unknown>
  ): Promise<LightMyRequestResponse> =>
    await app.inject({ method: 'POST', url: '/api/auth/register', body });

  it('stores only an argon2id hash and never returns it', async () => {
    const password = 'correct horse battery staple';
    const response = await register({ email: 'Ann@Example.org', password });

    assert.equal(response.statusCode, 201);
    const user = response.json<Record<string, unknown>>();
    assert.deepEqual(Object.keys(user).sort(), [
      'createdAt',
      'email',
      'id',
      'role',
    ]);
    assert.equal(user.email, 'ann@example.org');
    assert.equal(user.role, 'user');

    const stored = await users.findByEmail('ann@example.org');
    assert.match(
      stored?.passwordHash ?? '',
      /^\$argon2id\$v=19\$m=19456,t=2,p=1\$/
    );
    assert.ok(!(stored?.passwordHash ?? '').includes(password));
  });

  it('answers 409 for an e-mail that is already taken, in any case', async () => {
    const password = 'correct horse battery staple';
    await register({ email: 'ann@example.org', password });
    const response = await register({ email: 'ANN@example.org', password });

    assert.equal(response.statusCode, 409);
    assert.match(
      response.headers['content-type'] ?? '',
      /^application\/problem\+json/
    );
  });

  it('rejects bad e-mails, short passwords and extra fields', async () => {
    const response = await register({
      email: 'not-an-email',
      password: 'too short',
      role: 'moderator',
    });

    assert.equal(response.statusCode, 400);
    const pointers = response
      .json<{ errors: Array<{ pointer: string }> }>()
      .errors.map((error) => error.pointer)
      .sort();
    assert.deepEqual(pointers, ['', '/email', '/password']);
  });

  it('has no composition rules: a long lowercase passphrase is fine', async () => {
    const response = await register({
      email: 'bob@example.org',
      password: 'bears like honey a lot',
    });
    assert.equal(response.statusCode, 201);
  });

  it('logs in with a session cookie that logout really invalidates', async () => {
    const credentials = {
      email: 'ann@example.org',
      password: 'correct horse battery staple',
    };
    await register(credentials);
    const me = async (cookie?: string): Promise<number> =>
      (
        await app.inject({
          url: '/api/auth/me',
          headers: cookie === undefined ? {} : { cookie },
        })
      ).statusCode;

    const wrong = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      body: { ...credentials, password: 'wrong password!' },
    });
    assert.equal(wrong.statusCode, 401);

    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      body: credentials,
    });
    assert.equal(login.statusCode, 200);
    const setCookie = String(login.headers['set-cookie']);
    assert.match(setCookie, /HttpOnly/);
    assert.match(setCookie, /SameSite=Lax/);
    assert.match(setCookie, /Path=\/api/);
    const cookie = setCookie.split(';')[0] ?? '';

    assert.equal(await me(cookie), 200);
    assert.equal(await me(), 401);

    const logout = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: { cookie },
    });
    assert.equal(logout.statusCode, 204);
    // A copy of the old cookie is worthless now.
    assert.equal(await me(cookie), 401);
  });
});

describe('hardening', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = buildApp(
      { ...config, authRateLimit: { max: 3, windowSeconds: 60 } },
      { users: createInMemoryUserRepository() }
    );
  });
  afterEach(async () => {
    await app.close();
  });

  const login = async (): Promise<LightMyRequestResponse> =>
    await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: 'ann@example.org', password: 'guess' },
    });

  it('answers 429 with Retry-After once the login limit is used up', async () => {
    for (let i = 0; i < 3; i++) assert.equal((await login()).statusCode, 401);

    const limited = await login();
    assert.equal(limited.statusCode, 429);
    assert.equal(limited.headers['retry-after'], '60');
    assert.match(
      limited.headers['content-type'] ?? '',
      /^application\/problem\+json/
    );
  });

  it('sends security headers and rejects oversized bodies', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ email: 'x'.repeat(20_000) }),
    });

    assert.equal(response.statusCode, 413);
    assert.equal(response.headers['x-content-type-options'], 'nosniff');
    assert.match(
      String(response.headers['content-security-policy']),
      /frame-ancestors 'self'/
    );
  });
});
