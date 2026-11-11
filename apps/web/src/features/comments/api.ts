import { requestJson, requestNoContent } from '../../api/client';
import {
  CommentListSchema,
  CommentSchema,
  type CommentEntry,
  type NewComment,
} from './types';

function bearCommentsPath(bearId: string): string {
  return `/bears/${encodeURIComponent(bearId)}/comments`;
}

export async function fetchComments(
  bearId: string,
  signal: AbortSignal
): Promise<readonly CommentEntry[]> {
  return await requestJson(bearCommentsPath(bearId), CommentListSchema, {
    signal,
  });
}

export async function createComment(
  bearId: string,
  comment: NewComment
): Promise<CommentEntry> {
  return await requestJson(bearCommentsPath(bearId), CommentSchema, {
    method: 'POST',
    body: comment,
  });
}

export async function deleteComment(commentId: string): Promise<void> {
  await requestNoContent(`/comments/${encodeURIComponent(commentId)}`, {
    method: 'DELETE',
  });
}
