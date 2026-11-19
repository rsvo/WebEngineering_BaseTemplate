import { z } from 'zod';
import { BearIdSchema } from '../bears/schema.js';

export const AUTHOR_MAX_LENGTH = 80;
export const TEXT_MAX_LENGTH = 1000;

export const CommentIdSchema = z.uuid('must be a UUID');

// What a client may send. Surrounding whitespace is trimmed before the length
// checks, so "   " is rejected as empty. Unknown fields are rejected instead of
// silently dropped, so a typo such as `txt` surfaces as a 400.
export const CreateCommentSchema = z
  .strictObject({
    author: z
      .string()
      .trim()
      .min(1, 'must not be empty')
      .max(
        AUTHOR_MAX_LENGTH,
        `must be at most ${AUTHOR_MAX_LENGTH} characters`
      ),
    text: z
      .string()
      .trim()
      .min(1, 'must not be empty')
      .max(TEXT_MAX_LENGTH, `must be at most ${TEXT_MAX_LENGTH} characters`),
  })
  .meta({ id: 'NewComment' });

export type CreateComment = z.infer<typeof CreateCommentSchema>;

// What the API returns: the server assigns id, bearId and createdAt.
export const CommentSchema = z
  .object({
    id: CommentIdSchema,
    bearId: BearIdSchema,
    author: z.string(),
    text: z.string(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'Comment' });

export type Comment = z.infer<typeof CommentSchema>;

export const CommentListSchema = z.array(CommentSchema);

// Position after which the next page starts: the sort key of the last comment
// of the previous page.
export interface CommentCursor {
  createdAt: string;
  id: string;
}

const CursorPayloadSchema = z.object({
  createdAt: z.iso.datetime(),
  id: CommentIdSchema,
});

// Opaque to clients (base64url JSON), so its format can change later.
export function encodeCursor(cursor: CommentCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

const CursorSchema = z
  .string()
  .max(200)
  .transform((value, ctx): CommentCursor => {
    try {
      const json: unknown = JSON.parse(
        Buffer.from(value, 'base64url').toString('utf8')
      );
      return CursorPayloadSchema.parse(json);
    } catch {
      ctx.addIssue({
        code: 'custom',
        message: 'must be a nextCursor returned by this API',
      });
      return z.NEVER;
    }
  })
  .meta({ description: 'The `nextCursor` of the previous page.' });

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const CommentPageQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
  cursor: CursorSchema.optional(),
});

export type CommentPageQuery = z.infer<typeof CommentPageQuerySchema>;

export const CommentPageSchema = z
  .object({
    items: CommentListSchema,
    nextCursor: z.string().nullable().meta({
      description:
        'Pass as `cursor` to get the next page; `null` on the last page.',
    }),
  })
  .meta({ id: 'CommentPage' });
