import { useState, type ReactElement } from 'react';
import { Highlight } from '../search/Highlight';
import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';
import { INITIAL_COMMENTS } from './constants';
import type { CommentEntry } from './types';

interface CommentsSectionProps {
  query: string;
}

export function CommentsSection({ query }: CommentsSectionProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] =
    useState<readonly CommentEntry[]>(INITIAL_COMMENTS);

  function handleAdd(author: string, text: string): void {
    setComments((previous) => [
      ...previous,
      { id: crypto.randomUUID(), author, text },
    ]);
  }

  return (
    <section className="comments">
      <div
        className="show-hide"
        onClick={() => {
          setIsOpen((open) => !open);
        }}
      >
        {isOpen ? 'Hide comments' : 'Show comments'}
      </div>

      <div className="comment-wrapper" hidden={!isOpen}>
        <font size="6">
          <Highlight text="Add comment" query={query} />
        </font>
        <CommentForm onAdd={handleAdd} />

        <font size="6">
          <Highlight text="Comments" query={query} />
        </font>
        <CommentList comments={comments} query={query} />
      </div>
    </section>
  );
}
