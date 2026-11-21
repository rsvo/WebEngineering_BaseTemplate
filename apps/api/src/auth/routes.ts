import fastifyCookie, { type CookieSerializeOptions } from '@fastify/cookie';
import type { FastifyInstance } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ConflictError, UnauthorizedError } from '../errors.js';
import { problemResponses } from '../openapi.js';
import {
  CredentialsSchema,
  LoginSchema,
  UserSchema,
  type User,
} from './schema.js';
import { SESSION_TTL_SECONDS, type AuthService } from './service.js';

declare module 'fastify' {
  interface FastifyRequest {
    // The logged-in user, or null. Set by the preValidation hook below.
    user: User | null;
  }
}

export const SESSION_COOKIE = 'session';
const TAGS = ['auth'];

interface AuthOptions {
  auth: AuthService;
  secureCookies: boolean;
}

const authRoutes: FastifyPluginAsyncZod<AuthOptions> = async (
  app,
  { auth, secureCookies }
) => {
  // HttpOnly: no JavaScript (and no XSS) can read it. Secure: HTTPS only.
  // SameSite=Lax: not sent on cross-site POSTs, but on links to the site.
  // Path: only sent to the API.
  const cookie: CookieSerializeOptions = {
    httpOnly: true,
    secure: secureCookies,
    sameSite: 'lax',
    path: '/api',
  };

  app.post(
    '/auth/register',
    {
      schema: {
        tags: TAGS,
        summary: 'Create an account',
        description:
          'The password needs at least 12 characters and nothing else; it is stored only as an argon2id hash. Every new account has the role `user`.',
        body: CredentialsSchema,
        response: { 201: UserSchema, ...problemResponses(400, 409, 500) },
      },
    },
    async (request, reply) => {
      const user = await auth.register(request.body);
      if (user === undefined) {
        throw new ConflictError(
          'An account with this e-mail address already exists.'
        );
      }
      return await reply.code(201).send(user);
    }
  );

  app.post(
    '/auth/login',
    {
      schema: {
        tags: TAGS,
        summary: 'Log in',
        description: `Sets the HttpOnly \`${SESSION_COOKIE}\` cookie, valid for 7 days or until logout.`,
        body: LoginSchema,
        response: { 200: UserSchema, ...problemResponses(400, 401, 500) },
      },
    },
    async (request, reply) => {
      const session = await auth.login(request.body);
      if (session === undefined) {
        throw new UnauthorizedError('The e-mail or password is wrong.');
      }
      return await reply
        .setCookie(SESSION_COOKIE, session.token, {
          ...cookie,
          maxAge: SESSION_TTL_SECONDS,
        })
        .send(session.user);
    }
  );

  app.post(
    '/auth/logout',
    {
      schema: {
        tags: TAGS,
        summary: 'Log out',
        description:
          'Deletes the session on the server, so the cookie is worthless even if it was copied. Idempotent.',
        response: { 204: z.undefined(), ...problemResponses(500) },
      },
    },
    async (request, reply) => {
      const token = request.cookies[SESSION_COOKIE];
      if (token !== undefined) await auth.logout(token);
      return await reply.clearCookie(SESSION_COOKIE, cookie).code(204).send();
    }
  );

  app.get(
    '/auth/me',
    {
      schema: {
        tags: TAGS,
        summary: 'The logged-in user',
        response: { 200: UserSchema, ...problemResponses(401, 500) },
      },
    },
    async (request) => {
      if (request.user === null) {
        throw new UnauthorizedError('You are not logged in.');
      }
      return request.user;
    }
  );
};

// Not encapsulated: the hook and `request.user` apply to every route.
export function registerAuth(app: FastifyInstance, options: AuthOptions): void {
  void app.register(fastifyCookie);
  app.decorateRequest('user', null);
  // preValidation: before route hooks like requireLogin, so an anonymous
  // request gets a 401 even if its body is also invalid.
  app.addHook('preValidation', async (request) => {
    const token = request.cookies[SESSION_COOKIE];
    if (token !== undefined) {
      request.user = (await options.auth.authenticate(token)) ?? null;
    }
  });
  void app.register(authRoutes, { prefix: '/api', ...options });
}
