import type { ReactElement } from 'react';
import { Link, useParams } from 'react-router';
import { BearDetail } from '../features/bears/BearDetail';
import { BearsGate } from '../features/bears/BearsGate';
import type { BearsState } from '../features/bears/useBears';

interface BearDetailPageProps {
  bearsState: BearsState;
  onRetry: () => void;
  query: string;
}

export function BearDetailPage({
  bearsState,
  onRetry,
  query,
}: BearDetailPageProps): ReactElement {
  const { bearId } = useParams();

  return (
    <article className="bear-detail">
      <BearsGate state={bearsState} onRetry={onRetry}>
        {(bears) => {
          const bear = bears.find((candidate) => candidate.id === bearId);
          if (bear === undefined) {
            return (
              <>
                <p role="alert">There is no bear with the id “{bearId}”.</p>
                <p>
                  <Link to="/">Back to all bears</Link>
                </p>
              </>
            );
          }
          return <BearDetail key={bear.id} bear={bear} query={query} />;
        }}
      </BearsGate>
    </article>
  );
}
