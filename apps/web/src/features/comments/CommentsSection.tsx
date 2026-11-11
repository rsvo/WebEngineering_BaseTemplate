import { useState, type ReactElement } from 'react';
import { Highlight } from '../search/Highlight';
import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';
import { useComments } from './useComments';

interface CommentsSectionProps {
  bearId: string;
  query: string;
}

export function CommentsSection({
  bearId,
  query,
}: CommentsSectionProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const { state, reload, add, remove } = useComments(bearId);

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
        <CommentForm onAdd={add} />

        <font size="6">
          <Highlight text="Comments" query={query} />
        </font>
        {state.status === 'loading' && <p role="status">Loading comments...</p>}
        {state.status === 'error' && (
          <>
            <p className="error-message" role="alert">
              {state.message}
            </p>
            <button type="button" className="retry" onClick={reload}>
              Try again
            </button>
          </>
        )}
        {state.status === 'success' && (
          <CommentList
            comments={state.comments}
            query={query}
            onDelete={remove}
          />
        )}
      </div>
    </section>
  );
}
