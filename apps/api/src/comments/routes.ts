import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  canDeleteComment,
  loggedInUser,
  requireLogin,
} from '../auth/policy.js';
import type { BearRepository } from '../bears/repository.js';
import { getBearOr404 } from '../bears/routes.js';
import { BearIdSchema } from '../bears/schema.js';
import { ForbiddenError, NotFoundError } from '../errors.js';
import { problemResponses } from '../openapi.js';
import type { CommentRepository } from './repository.js';
import {
  CommentIdSchema,
  CommentListSchema,
  CommentPageQuerySchema,
  CommentPageSchema,
  CommentSchema,
  CreateCommentSchema,
  encodeCursor,
} from './schema.js';
import { HIDE_AT_REPORTS, type CommentService } from './service.js';

interface CommentRoutesOptions {
  bears: BearRepository;
  comments: CommentRepository;
  commentService: CommentService;
}

const BearParamsSchema = z.object({ id: BearIdSchema });
const CommentParamsSchema = z.object({ commentId: CommentIdSchema });
const TAGS = ['comments'];

export const commentRoutes: FastifyPluginAsyncZod<
  CommentRoutesOptions
> = async (app, { bears, comments, commentService }) => {
  app.get(
    '/comments',
    {
      schema: {
        tags: TAGS,
        summary: 'List the comments of all bears',
        description:
          'Grouped by bear id, newest first; every bear has an entry. Two queries in total (bears, then all their comments), no matter how many bears there are.',
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
        summary: "List a bear's comments, one page at a time",
        description:
          'Newest first, `limit` per page. For the next page, pass the `nextCursor` of this one as `cursor`; it is `null` on the last page. Comments created or deleted in between never shift a page.',
        params: BearParamsSchema,
        querystring: CommentPageQuerySchema,
        response: {
          200: CommentPageSchema,
          ...problemResponses(400, 404, 500),
        },
      },
    },
    async (request) => {
      // Throws NotFoundError (404) for unknown bears, so "no comments yet"
      // (200, no items) and "no such bear" (404) stay distinguishable.
      const bear = await getBearOr404(bears, request.params.id);
      const page = await comments.listByBear(bear.id, request.query);
      return {
        items: page.items,
        nextCursor:
          page.nextCursor === null ? null : encodeCursor(page.nextCursor),
      };
    }
  );

  app.post(
    '/bears/:id/comments',
    {
      schema: {
        tags: TAGS,
        summary: 'Add a comment to a bear',
        description:
          'Needs a login. Answers 201 Created with the new comment and its URL in `Location`. Not idempotent: sending the same request twice creates two comments.',
        params: BearParamsSchema,
        body: CreateCommentSchema,
        response: {
          201: CommentSchema,
          ...problemResponses(400, 401, 404, 500),
        },
      },
      preValidation: requireLogin,
    },
    async (request, reply) => {
      const bear = await getBearOr404(bears, request.params.id);
      const comment = await comments.create(bear.id, {
        ...request.body,
        authorId: loggedInUser(request).id,
      });
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
          'Allowed for its author and for moderators. Idempotent: once the comment is gone, repeating the request answers 404 but changes nothing.',
        params: CommentParamsSchema,
        response: {
          204: z.undefined(),
          ...problemResponses(400, 401, 403, 404, 500),
        },
      },
      preValidation: requireLogin,
    },
    async (request, reply) => {
      const { commentId } = request.params;
      const comment = await comments.findById(commentId, {
        includeHidden: true,
      });
      // Repeating a DELETE still leaves the server in the same state (the
      // comment is gone); only the response tells the client it already was.
      if (comment === undefined) {
        throw new NotFoundError(
          `There is no comment with the id "${commentId}".`
        );
      }
      if (!canDeleteComment(loggedInUser(request), comment)) {
        throw new ForbiddenError(
          'Only its author or a moderator may delete this comment.'
        );
      }
      await comments.delete(commentId);
      return await reply.code(204).send();
    }
  );

  app.post(
    '/comments/:commentId/report',
    {
      schema: {
        tags: TAGS,
        summary: 'Report a comment',
        description: `Adds one report. At ${HIDE_AT_REPORTS} reports the comment is hidden: no longer listed and 404 on GET, but it can still be reported and deleted. Not idempotent: every request counts.`,
        params: CommentParamsSchema,
        response: {
          200: z
            .object({
              reportCount: z.number().int().min(1),
              hidden: z.boolean(),
            })
            .meta({ id: 'ReportResult' }),
          ...problemResponses(400, 404, 500),
        },
      },
    },
    async (request) => {
      const result = await commentService.report(request.params.commentId);
      if (result === undefined) {
        throw new NotFoundError(
          `There is no comment with the id "${request.params.commentId}".`
        );
      }
      return result;
    }
  );
};
