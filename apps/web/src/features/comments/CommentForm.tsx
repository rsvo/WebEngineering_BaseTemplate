import { useState, type FormEvent, type ReactElement } from 'react';
import { ApiError, type FieldError } from '../../api/client';
import { messageFromError } from '../../utils/errors';
import { AUTHOR_MAX_LENGTH, TEXT_MAX_LENGTH, type NewComment } from './types';

interface CommentFormProps {
  onAdd: (comment: NewComment) => Promise<void>;
}

// The API reports invalid fields as JSON pointers into the request body.
const FIELD_LABELS: Readonly<Record<string, string>> = {
  '/author': 'Name',
  '/text': 'Comment',
};

function describeFieldError({ pointer, detail }: FieldError): string {
  const label = FIELD_LABELS[pointer];
  return label === undefined ? detail : `${label} ${detail}.`;
}

export function CommentForm({ onAdd }: CommentFormProps): ReactElement {
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<readonly FieldError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function isInvalid(pointer: string): boolean {
    return fieldErrors.some((fieldError) => fieldError.pointer === pointer);
  }

  async function submit(author: string, text: string): Promise<void> {
    setIsSubmitting(true);
    try {
      await onAdd({ author, text });
      // Only cleared once the server has stored the comment, so a failed
      // request does not lose what the user typed.
      setName('');
      setComment('');
      setError(null);
      setFieldErrors([]);
    } catch (err) {
      setError(messageFromError(err));
      setFieldErrors(err instanceof ApiError ? err.errors : []);
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
      setFieldErrors([]);
      return;
    }

    void submit(author, text);
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      {error !== null && (
        <div className="error-message" role="alert" id="comment-form-error">
          <p>{error}</p>
          {fieldErrors.length > 0 && (
            <ul>
              {fieldErrors.map((fieldError) => (
                <li key={`${fieldError.location}${fieldError.pointer}`}>
                  {describeFieldError(fieldError)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="flex-pair">
        Your name:
        <input
          type="text"
          name="name"
          id="name"
          placeholder="Enter your name"
          maxLength={AUTHOR_MAX_LENGTH}
          aria-invalid={isInvalid('/author')}
          aria-describedby={
            isInvalid('/author') ? 'comment-form-error' : undefined
          }
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
          aria-invalid={isInvalid('/text')}
          aria-describedby={
            isInvalid('/text') ? 'comment-form-error' : undefined
          }
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
