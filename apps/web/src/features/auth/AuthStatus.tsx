import { useState, type ReactElement } from 'react';
import { Link } from 'react-router';
import { messageFromError } from '../../utils/errors';
import { useAuth } from './AuthContext';

export function AuthStatus(): ReactElement | null {
  const { user, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);

  if (user === undefined) return null;
  if (user === null) {
    return (
      <div className="auth-status">
        <Link to="/login">Log in</Link>
        <Link to="/register">Register</Link>
      </div>
    );
  }
  return (
    <div className="auth-status">
      <span>
        {user.email}
        {user.role === 'moderator' && ' (moderator)'}
      </span>
      <button
        type="button"
        onClick={() => {
          logout().catch((err: unknown) => {
            setError(messageFromError(err));
          });
        }}
      >
        Log out
      </button>
      {error !== null && <span role="alert">{error}</span>}
    </div>
  );
}
