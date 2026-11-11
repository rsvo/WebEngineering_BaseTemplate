import type { ReactElement } from 'react';
import { Link, useParams } from 'react-router';
import { BearDetail } from '../features/bears/BearDetail';
import { useBear } from '../features/bears/useBear';

interface BearDetailPageProps {
  query: string;
}

export function BearDetailPage({ query }: BearDetailPageProps): ReactElement {
  const { bearId = '' } = useParams();
  const { state, reload } = useBear(bearId);

  return (
    <article className="bear-detail">
      {state.status === 'loading' && <p role="status">Loading bear...</p>}

      {state.status === 'not-found' && (
        <>
          <p role="alert">There is no bear with the id “{bearId}”.</p>
          <p>
            <Link to="/">Back to all bears</Link>
          </p>
        </>
      )}

      {state.status === 'error' && (
        <>
          <p className="error-message" role="alert">
            {state.message}
          </p>
          <button type="button" className="retry" onClick={reload}>
            Try again
          </button>
        </>
      )}

      {state.status === 'success' && (
        <BearDetail key={state.bear.id} bear={state.bear} query={query} />
      )}
    </article>
  );
}
