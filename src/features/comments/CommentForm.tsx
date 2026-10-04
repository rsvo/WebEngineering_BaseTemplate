import { useState, type FormEvent, type ReactElement } from 'react';

interface CommentFormProps {
  onAdd: (author: string, text: string) => void;
}

export function CommentForm({ onAdd }: CommentFormProps): ReactElement {
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const author = name.trim();
    const text = comment.trim();
    if (author === '' || text === '') {
      setError('Please enter both a name and a comment.');
      return;
    }

    onAdd(author, text);
    setName('');
    setComment('');
    setError(null);
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
          value={comment}
          onChange={(event) => {
            setComment(event.target.value);
          }}
        />
      </div>
      <div>
        <input type="submit" value="Submit comment" />
      </div>
    </form>
  );
}
