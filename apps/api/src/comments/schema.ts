import { z } from 'zod';
import { BearIdSchema } from '../bears/schema.js';

export const AUTHOR_MAX_LENGTH = 80;
export const TEXT_MAX_LENGTH = 1000;

export const CommentIdSchema = z.uuid('must be a UUID');

// What a client may send. Surrounding whitespace is trimmed before the length
// checks, so "   " is rejected as empty. Unknown fields are rejected instead of
// silently dropped, so a typo such as `txt` surfaces as a 400.
export const CreateCommentSchema = z.strictObject({
  author: z
    .string()
    .trim()
    .min(1, 'must not be empty')
    .max(AUTHOR_MAX_LENGTH, `must be at most ${AUTHOR_MAX_LENGTH} characters`),
  text: z
    .string()
    .trim()
    .min(1, 'must not be empty')
    .max(TEXT_MAX_LENGTH, `must be at most ${TEXT_MAX_LENGTH} characters`),
});

export type CreateComment = z.infer<typeof CreateCommentSchema>;

// What the API returns: the server assigns id, bearId and createdAt.
export const CommentSchema = z.object({
  id: CommentIdSchema,
  bearId: BearIdSchema,
  author: z.string(),
  text: z.string(),
  createdAt: z.iso.datetime(),
});

export type Comment = z.infer<typeof CommentSchema>;

export const CommentListSchema = z.array(CommentSchema);
