import type { ReactElement } from 'react';

export function CommentForm(): ReactElement {
  return (
    <form className="comment-form">
      <div className="flex-pair">
        Your name:
        <input
          type="text"
          name="name"
          id="name"
          placeholder="Enter your name"
        />
      </div>
      <div className="flex-pair">
        Your comment:
        <input
          type="text"
          name="comment"
          id="comment"
          placeholder="Enter your comment"
        />
      </div>
      <div>
        <input type="submit" value="Submit comment" />
      </div>
    </form>
  );
}
