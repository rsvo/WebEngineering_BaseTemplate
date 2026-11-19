import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { BearRepository } from '../bears/repository.js';
import { getBearOr404 } from '../bears/routes.js';
import { BearIdSchema } from '../bears/schema.js';
import { NotFoundError } from '../errors.js';
import { problemResponses } from '../openapi.js';
import type { CommentRepository } from './repository.js';
import {
  CommentIdSchema,
  CommentListSchema,
  CommentSchema,
  CreateCommentSchema,
} from './schema.js';

interface CommentRoutesOptions {
  bears: BearRepository;
  comments: CommentRepository;
}

const BearParamsSchema = z.object({ id: BearIdSchema });
const CommentParamsSchema = z.object({ commentId: CommentIdSchema });
const TAGS = ['comments'];

export const commentRoutes: FastifyPluginAsyncZod<
  CommentRoutesOptions
> = async (app, { bears, comments }) => {
  app.get(
    '/comments',
    {
      schema: {
        tags: TAGS,
        summary: 'List the comments of all bears',
        description:
          'Grouped by bear id, oldest first; every bear has an entry. Two queries in total (bears, then all their comments), no matter how many bears there are.',
        response: {
          200: z.record(BearIdSchema, CommentListSchema),
          ...problemResponses(500),
        },
      },
    },
    async () => {
      const ids = (await bears.list()).map((bear) => bear.id);
      return Object.fromEntries(await comments.listByBears(ids));
    }
  );

  app.get(
    '/bears/:id/comments',
    {
      schema: {
        tags: TAGS,
        summary: "List a bear's comments",
        description: 'Oldest first; `[]` if the bear has no comments yet.',
        params: BearParamsSchema,
        response: {
          200: CommentListSchema,
          ...problemResponses(400, 404, 500),
        },
      },
    },
    async (request) => {
      // Throws NotFoundError (404) for unknown bears, so "no comments yet"
      // (200 []) and "no such bear" (404) stay distinguishable.
      const bear = await getBearOr404(bears, request.params.id);
      return await comments.listByBear(bear.id);
    }
  );

  app.post(
    '/bears/:id/comments',
    {
      schema: {
        tags: TAGS,
        summary: 'Add a comment to a bear',
        description:
          'Answers 201 Created with the new comment and its URL in `Location`. Not idempotent: sending the same request twice creates two comments.',
        params: BearParamsSchema,
        body: CreateCommentSchema,
        response: {
          201: CommentSchema,
          ...problemResponses(400, 404, 500),
        },
      },
    },
    async (request, reply) => {
      const bear = await getBearOr404(bears, request.params.id);
      const comment = await comments.create(bear.id, request.body);
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
        tags: TAGS,
        summary: 'Get one comment',
        params: CommentParamsSchema,
        response: {
          200: CommentSchema,
          ...problemResponses(400, 404, 500),
        },
      },
    },
    async (request) => {
      const comment = await comments.findById(request.params.commentId);
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
    {
      schema: {
        tags: TAGS,
        summary: 'Delete a comment',
        description:
          'Idempotent: once the comment is gone, repeating the request answers 404 but changes nothing.',
        params: CommentParamsSchema,
        response: {
          204: z.undefined(),
          ...problemResponses(400, 404, 500),
        },
      },
    },
    async (request, reply) => {
      if (!(await comments.delete(request.params.commentId))) {
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
