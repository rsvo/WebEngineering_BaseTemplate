import { useState, type FormEvent, type ReactElement } from 'react';
import { ApiError, type FieldError } from '../../api/client';
import { messageFromError } from '../../utils/errors';
import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  type Credentials,
} from './types';

interface CredentialsFormProps {
  mode: 'login' | 'register';
  onSubmit: (credentials: Credentials) => Promise<void>;
}

const FIELD_LABELS: Readonly<Record<string, string>> = {
  '/email': 'E-mail',
  '/password': 'Password',
};

function describeFieldError({ pointer, detail }: FieldError): string {
  const label = FIELD_LABELS[pointer];
  return label === undefined ? detail : `${label} ${detail}.`;
}

export function CredentialsForm({
  mode,
  onSubmit,
}: CredentialsFormProps): ReactElement {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<readonly FieldError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegister = mode === 'register';

  const isInvalid = (pointer: string): boolean =>
    fieldErrors.some((fieldError) => fieldError.pointer === pointer);

  async function submit(): Promise<void> {
    setIsSubmitting(true);
    try {
      await onSubmit({ email, password });
    } catch (err) {
      setError(messageFromError(err));
      setFieldErrors(err instanceof ApiError ? err.errors : []);
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!isSubmitting) void submit();
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
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          required
          minLength={isRegister ? PASSWORD_MIN_LENGTH : undefined}
          maxLength={PASSWORD_MAX_LENGTH}
          aria-invalid={isInvalid('/password')}
          aria-describedby={isRegister ? 'password-hint' : undefined}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
          }}
        />
      </div>
      {isRegister && (
        <p id="password-hint" className="hint">
          At least {PASSWORD_MIN_LENGTH} characters. A few random words make a
          good password.
        </p>
      )}
      <div>
        <input
          type="submit"
          value={isRegister ? 'Create account' : 'Log in'}
          disabled={isSubmitting}
        />
      </div>
    </form>
  );
}
