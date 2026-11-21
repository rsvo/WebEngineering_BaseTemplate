import { useState, type ReactElement } from 'react';
import { messageFromError } from '../../utils/errors';
import { useAuth } from '../auth/AuthContext';
import { Highlight } from '../search/Highlight';
import type { CommentEntry, ReportResult } from './types';

interface CommentListProps {
  comments: readonly CommentEntry[];
  query: string;
  onDelete: (commentId: string) => Promise<void>;
  onReport: (commentId: string) => Promise<ReportResult>;
}

type Action = 'delete' | 'report';

export function CommentList({
  comments,
  query,
  onDelete,
  onReport,
}: CommentListProps): ReactElement {
  const [busy, setBusy] = useState<{ id: string; action: Action } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { user } = useAuth();
  // Mirrors the API's policy only to hide a button that would fail anyway;
  // the API enforces it.
  const canDelete = (comment: CommentEntry): boolean =>
    user != null && (user.role === 'moderator' || user.id === comment.authorId);

  async function run(
    id: string,
    action: Action,
    work: () => Promise<void>
  ): Promise<void> {
    setBusy({ id, action });
    setError(null);
    setNotice(null);
    try {
      await work();
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleReport(commentId: string): Promise<void> {
    const { hidden } = await onReport(commentId);
    setNotice(
      hidden
        ? 'Thanks for your report. The comment has been hidden.'
        : 'Thanks for your report.'
    );
  }

  if (comments.length === 0) {
    return (
      <>
        {notice !== null && <p role="status">{notice}</p>}
        <p role="status">No comments yet. Be the first!</p>
      </>
    );
  }

  return (
    <>
      {error !== null && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {notice !== null && <p role="status">{notice}</p>}
      <ul className="comment-container">
        {comments.map((comment) => {
          const isBusy = busy?.id === comment.id;
          return (
            <li key={comment.id}>
              <p>
                <Highlight text={comment.author} query={query} />
              </p>
              <p>
                <Highlight text={comment.text} query={query} />
              </p>
              <button
                type="button"
                className="report-comment"
                disabled={isBusy}
                aria-label={`Report comment by ${comment.author}`}
                onClick={() => {
                  void run(comment.id, 'report', async () => {
                    await handleReport(comment.id);
                  });
                }}
              >
                {isBusy && busy.action === 'report' ? 'Reporting...' : 'Report'}
              </button>
              {canDelete(comment) && (
                <button
                  type="button"
                  className="delete-comment"
                  disabled={isBusy}
                  aria-label={`Delete comment by ${comment.author}`}
                  onClick={() => {
                    void run(comment.id, 'delete', async () => {
                      await onDelete(comment.id);
                    });
                  }}
                >
                  {isBusy && busy.action === 'delete'
                    ? 'Deleting...'
                    : 'Delete'}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
