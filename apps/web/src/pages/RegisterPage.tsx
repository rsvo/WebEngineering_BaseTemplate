import type { ReactElement } from 'react';
import { RegisterForm } from '../features/auth/RegisterForm';

export function RegisterPage(): ReactElement {
  return (
    <article>
      <font size="6">Create an account</font>
      <RegisterForm />
    </article>
  );
}
