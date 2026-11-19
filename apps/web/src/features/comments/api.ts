import { requestJson, requestNoContent } from '../../api/client';
import {
  CommentPageSchema,
  CommentSchema,
  ReportResultSchema,
  type CommentEntry,
  type CommentPage,
  type NewComment,
  type ReportResult,
} from './types';

const PAGE_SIZE = 10;

function bearCommentsPath(bearId: string): string {
  return `/bears/${encodeURIComponent(bearId)}/comments`;
}

// Newest first; `cursor` is the `nextCursor` of the previous page.
export async function fetchComments(
  bearId: string,
  cursor: string | null,
  signal: AbortSignal
): Promise<CommentPage> {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (cursor !== null) params.set('cursor', cursor);
  return await requestJson(
    `${bearCommentsPath(bearId)}?${params.toString()}`,
    CommentPageSchema,
    { signal }
  );
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

export async function reportComment(commentId: string): Promise<ReportResult> {
  return await requestJson(
    `/comments/${encodeURIComponent(commentId)}/report`,
    ReportResultSchema,
    { method: 'POST' }
  );
}
