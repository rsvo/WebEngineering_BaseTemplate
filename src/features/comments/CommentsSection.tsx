import type { ReactElement } from 'react';
import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';
import type { CommentEntry } from './types';

const INITIAL_COMMENTS: readonly CommentEntry[] = [
  {
    id: 'bob-fossil-1',
    author: 'Bob Fossil',
    text: 'Oh I am so glad you taught me all about the big brown angry guys...',
  },
];

export function CommentsSection(): ReactElement {
  return (
    <section className="comments">
      <div className="show-hide">Show comments</div>
      <p className="error-message" hidden></p>

      <div className="comment-wrapper" hidden>
        <font size="6">Add comment</font>
        <CommentForm />

        <font size="6">Comments</font>
        <CommentList comments={INITIAL_COMMENTS} />
      </div>
    </section>
  );
}
