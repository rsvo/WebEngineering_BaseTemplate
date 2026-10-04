import type { ReactElement } from 'react';
import { Highlight } from '../search/Highlight';
import type { CommentEntry } from './types';

interface CommentListProps {
  comments: readonly CommentEntry[];
  query: string;
}

export function CommentList({
  comments,
  query,
}: CommentListProps): ReactElement {
  return (
    <ul className="comment-container">
      {comments.map((comment) => (
        <li key={comment.id}>
          <p>
            <Highlight text={comment.author} query={query} />
          </p>
          <p>
            <Highlight text={comment.text} query={query} />
          </p>
        </li>
      ))}
    </ul>
  );
}
