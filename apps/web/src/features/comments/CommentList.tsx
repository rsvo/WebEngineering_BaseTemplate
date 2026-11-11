import { useState, type ReactElement } from 'react';
import { messageFromError } from '../../utils/errors';
import { Highlight } from '../search/Highlight';
import type { CommentEntry } from './types';

interface CommentListProps {
  comments: readonly CommentEntry[];
  query: string;
  onDelete: (commentId: string) => Promise<void>;
}

export function CommentList({
  comments,
  query,
  onDelete,
}: CommentListProps): ReactElement {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(commentId: string): Promise<void> {
    setDeletingId(commentId);
    setError(null);
    try {
      await onDelete(commentId);
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setDeletingId(null);
    }
  }

  if (comments.length === 0) {
    return <p role="status">No comments yet. Be the first!</p>;
  }

  return (
    <>
      {error !== null && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <ul className="comment-container">
        {comments.map((comment) => (
          <li key={comment.id}>
            <p>
              <Highlight text={comment.author} query={query} />
            </p>
            <p>
              <Highlight text={comment.text} query={query} />
            </p>
            <button
              type="button"
              className="delete-comment"
              disabled={deletingId === comment.id}
              aria-label={`Delete comment by ${comment.author}`}
              onClick={() => {
                void handleDelete(comment.id);
              }}
            >
              {deletingId === comment.id ? 'Deleting...' : 'Delete'}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
