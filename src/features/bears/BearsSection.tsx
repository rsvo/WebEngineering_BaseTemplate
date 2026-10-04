import type { ReactElement } from 'react';
import { Highlight } from '../search/Highlight';
import { BearList } from './BearList';
import { BearsGate } from './BearsGate';
import type { BearsState } from './useBears';

interface BearsSectionProps {
  state: BearsState;
  onRetry: () => void;
  query: string;
}

export function BearsSection({
  state,
  onRetry,
  query,
}: BearsSectionProps): ReactElement {
  return (
    <section className="more_bears">
      <font size="5">
        <Highlight text="More Bears" query={query} />
      </font>
      <BearsGate state={state} onRetry={onRetry}>
        {(bears) => <BearList bears={bears} query={query} />}
      </BearsGate>
    </section>
  );
}
