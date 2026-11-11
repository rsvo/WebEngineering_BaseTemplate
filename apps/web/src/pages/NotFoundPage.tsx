import type { ReactElement } from 'react';
import { Link } from 'react-router';

export function NotFoundPage(): ReactElement {
  return (
    <article>
      <p role="alert">This page does not exist.</p>
      <p>
        <Link to="/">Back to the home page</Link>
      </p>
    </article>
  );
}
