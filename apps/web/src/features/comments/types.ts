import { z } from 'zod';

// Same limits as the API, so the form can stop most invalid input early. The
// API still validates everything; these only improve the user experience.
export const AUTHOR_MAX_LENGTH = 80;
export const TEXT_MAX_LENGTH = 1000;

export const CommentSchema = z.object({
  id: z.string().min(1),
  bearId: z.string().min(1),
  author: z.string(),
  text: z.string(),
  createdAt: z.string(),
});

export type CommentEntry = z.infer<typeof CommentSchema>;

export const CommentListSchema = z.array(CommentSchema).readonly();

export const CommentPageSchema = z.object({
  items: CommentListSchema,
  nextCursor: z.string().nullable(),
});

export type CommentPage = z.infer<typeof CommentPageSchema>;

export interface NewComment {
  author: string;
  text: string;
}
