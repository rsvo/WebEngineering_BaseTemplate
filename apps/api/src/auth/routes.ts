import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ConflictError } from '../errors.js';
import { problemResponses } from '../openapi.js';
import { CredentialsSchema, UserSchema } from './schema.js';
import type { AuthService } from './service.js';

const TAGS = ['auth'];

export const authRoutes: FastifyPluginAsyncZod<{ auth: AuthService }> = async (
  app,
  { auth }
) => {
  app.post(
    '/auth/register',
    {
      schema: {
        tags: TAGS,
        summary: 'Create an account',
        description:
          'The password needs at least 12 characters and nothing else; it is stored only as an argon2id hash. Every new account has the role `user`.',
        body: CredentialsSchema,
        response: {
          201: UserSchema,
          ...problemResponses(400, 409, 500),
        },
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
};
