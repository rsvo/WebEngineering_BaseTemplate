import type { ReactElement } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../features/auth/AuthContext';
import { CredentialsForm } from '../features/auth/CredentialsForm';

export function AuthPage({
  mode,
}: {
  mode: 'login' | 'register';
}): ReactElement {
  const auth = useAuth();
  const navigate = useNavigate();

  return (
    <article>
      <font size="6">{mode === 'login' ? 'Log in' : 'Create an account'}</font>
      <CredentialsForm
        key={mode}
        mode={mode}
        onSubmit={async (credentials) => {
          await auth[mode](credentials);
          await navigate('/');
        }}
      />
    </article>
  );
}
