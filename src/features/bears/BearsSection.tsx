import type { ReactElement } from 'react';
import { Highlight } from '../search/Highlight';
import { BearList } from './BearList';
import { useBears, type BearsState } from './useBears';

interface BearsContentProps {
  state: BearsState;
  query: string;
  onRetry: () => void;
}

function BearsContent({
  state,
  query,
  onRetry,
}: BearsContentProps): ReactElement {
  switch (state.status) {
    case 'loading':
      return <p role="status">Loading bears...</p>;
    case 'empty':
      return <p role="status">No bears were found.</p>;
    case 'error':
      return (
        <>
          <p className="error-message" role="alert">
            {state.message}
          </p>
          <button type="button" className="retry" onClick={onRetry}>
            Try again
          </button>
        </>
      );
    case 'success':
      return <BearList bears={state.bears} query={query} />;
  }
}

interface BearsSectionProps {
  query: string;
}

export function BearsSection({ query }: BearsSectionProps): ReactElement {
  const { state, reload } = useBears();

  return (
    <section className="more_bears">
      <font size="5">
        <Highlight text="More Bears" query={query} />
      </font>
      <BearsContent state={state} query={query} onRetry={reload} />
    </section>
  );
}
