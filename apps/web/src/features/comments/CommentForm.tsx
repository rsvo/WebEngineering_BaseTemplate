import { useState, type FormEvent, type ReactElement } from 'react';
import { messageFromError } from '../../utils/errors';
import { AUTHOR_MAX_LENGTH, TEXT_MAX_LENGTH, type NewComment } from './types';

interface CommentFormProps {
  onAdd: (comment: NewComment) => Promise<void>;
}

export function CommentForm({ onAdd }: CommentFormProps): ReactElement {
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(author: string, text: string): Promise<void> {
    setIsSubmitting(true);
    try {
      await onAdd({ author, text });
      // Only cleared once the server has stored the comment, so a failed
      // request does not lose what the user typed.
      setName('');
      setComment('');
      setError(null);
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    // POST is not idempotent: a second submit while the first is still in
    // flight would create the comment twice.
    if (isSubmitting) return;

    const author = name.trim();
    const text = comment.trim();
    if (author === '' || text === '') {
      setError('Please enter both a name and a comment.');
      return;
    }

    void submit(author, text);
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      {error !== null && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <div className="flex-pair">
        Your name:
        <input
          type="text"
          name="name"
          id="name"
          placeholder="Enter your name"
          maxLength={AUTHOR_MAX_LENGTH}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
      </div>
      <div className="flex-pair">
        Your comment:
        <input
          type="text"
          name="comment"
          id="comment"
          placeholder="Enter your comment"
          maxLength={TEXT_MAX_LENGTH}
          value={comment}
          onChange={(event) => {
            setComment(event.target.value);
          }}
        />
      </div>
      <div>
        <input
          type="submit"
          value={isSubmitting ? 'Submitting...' : 'Submit comment'}
          disabled={isSubmitting}
        />
      </div>
    </form>
  );
}
