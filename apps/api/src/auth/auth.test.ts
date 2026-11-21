import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import type { FastifyInstance } from 'fastify';
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

  const register = async (body: unknown): ReturnType<typeof app.inject> =>
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
});
