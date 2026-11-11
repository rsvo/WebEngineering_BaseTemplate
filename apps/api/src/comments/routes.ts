import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { BearIdSchema } from '../bears/schema.js';
import type { BearService } from '../bears/service.js';
import { NotFoundError } from '../errors.js';
import {
  CommentIdSchema,
  CommentListSchema,
  CommentSchema,
  CreateCommentSchema,
} from './schema.js';
import type { CommentStore } from './store.js';

interface CommentRoutesOptions {
  bears: BearService;
  comments: CommentStore;
}

const BearParamsSchema = z.object({ id: BearIdSchema });
const CommentParamsSchema = z.object({ commentId: CommentIdSchema });

export const commentRoutes: FastifyPluginAsyncZod<
  CommentRoutesOptions
> = async (app, { bears, comments }) => {
  app.get(
    '/bears/:id/comments',
    {
      schema: {
        params: BearParamsSchema,
        response: { 200: CommentListSchema },
      },
    },
    async (request) => {
      // Throws NotFoundError (404) for unknown bears, so "no comments yet"
      // (200 []) and "no such bear" (404) stay distinguishable.
      const bear = await bears.get(request.params.id);
      return comments.listByBear(bear.id);
    }
  );

  app.post(
    '/bears/:id/comments',
    {
      schema: {
        params: BearParamsSchema,
        body: CreateCommentSchema,
        response: { 201: CommentSchema },
      },
    },
    async (request, reply) => {
      const bear = await bears.get(request.params.id);
      const comment = comments.create(bear.id, request.body);
      // 201 + Location: a new resource was created, and this is its URL.
      return await reply
        .code(201)
        .header('location', `/api/comments/${comment.id}`)
        .send(comment);
    }
  );

  app.get(
    '/comments/:commentId',
    {
      schema: {
        params: CommentParamsSchema,
        response: { 200: CommentSchema },
      },
    },
    async (request) => {
      const comment = comments.get(request.params.commentId);
      if (comment === undefined) {
        throw new NotFoundError(
          `There is no comment with the id "${request.params.commentId}".`
        );
      }
      return comment;
    }
  );

  app.delete(
    '/comments/:commentId',
    { schema: { params: CommentParamsSchema } },
    async (request, reply) => {
      if (!comments.delete(request.params.commentId)) {
        // Repeating a DELETE still leaves the server in the same state (the
        // comment is gone); only the response tells the client it already was.
        throw new NotFoundError(
          `There is no comment with the id "${request.params.commentId}".`
        );
      }
      return await reply.code(204).send();
    }
  );
};
