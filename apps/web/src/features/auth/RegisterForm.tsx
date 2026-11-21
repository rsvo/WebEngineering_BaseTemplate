import { useState, type FormEvent, type ReactElement } from 'react';
import { ApiError, type FieldError } from '../../api/client';
import { messageFromError } from '../../utils/errors';
import { register } from './api';
import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  type User,
} from './types';

const FIELD_LABELS: Readonly<Record<string, string>> = {
  '/email': 'E-mail',
  '/password': 'Password',
};

function describeFieldError({ pointer, detail }: FieldError): string {
  const label = FIELD_LABELS[pointer];
  return label === undefined ? detail : `${label} ${detail}.`;
}

export function RegisterForm(): ReactElement {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<readonly FieldError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registered, setRegistered] = useState<User | null>(null);

  const isInvalid = (pointer: string): boolean =>
    fieldErrors.some((fieldError) => fieldError.pointer === pointer);

  async function submit(): Promise<void> {
    setIsSubmitting(true);
    try {
      setRegistered(await register({ email, password }));
      setPassword('');
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
    if (!isSubmitting) void submit();
  }

  if (registered !== null) {
    return (
      <p role="status">Your account {registered.email} has been created.</p>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {error !== null && (
        <div className="error-message" role="alert" id="auth-form-error">
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
        <label htmlFor="email">E-mail:</label>
        <input
          type="email"
          id="email"
          autoComplete="email"
          required
          maxLength={EMAIL_MAX_LENGTH}
          aria-invalid={isInvalid('/email')}
          aria-describedby={isInvalid('/email') ? 'auth-form-error' : undefined}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
          }}
        />
      </div>
      <div className="flex-pair">
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
          aria-invalid={isInvalid('/password')}
          aria-describedby="password-hint"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
          }}
        />
      </div>
      <p id="password-hint" className="hint">
        At least {PASSWORD_MIN_LENGTH} characters. A few random words make a
        good password.
      </p>
      <div>
        <input
          type="submit"
          value={isSubmitting ? 'Creating account...' : 'Create account'}
          disabled={isSubmitting}
        />
      </div>
    </form>
  );
}
