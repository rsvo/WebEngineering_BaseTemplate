import type { ReactElement } from 'react';
import type { CommentEntry } from './types';

interface CommentListProps {
  comments: readonly CommentEntry[];
}

export function CommentList({ comments }: CommentListProps): ReactElement {
  return (
    <ul className="comment-container">
      {comments.map((comment) => (
        <li key={comment.id}>
          <p>{comment.author}</p>
          <p>{comment.text}</p>
        </li>
      ))}
    </ul>
  );
}
