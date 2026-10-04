import type { ReactElement } from 'react';
import type { BearsState } from './useBears';
import type { BearWithImage } from './types';

interface BearsGateProps {
  state: BearsState;
  onRetry: () => void;
  children: (bears: readonly BearWithImage[]) => ReactElement;
}

// Renders the loading, empty and error states of the bear data, and hands the
// bears to its render function once they are available.
export function BearsGate({
  state,
  onRetry,
  children,
}: BearsGateProps): ReactElement {
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
      return children(state.bears);
  }
}
