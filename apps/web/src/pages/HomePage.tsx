import type { ReactElement } from 'react';
import { Article } from '../features/article/Article';
import { BearsSection } from '../features/bears/BearsSection';
import type { BearsState } from '../features/bears/useBears';
import { CommentsSection } from '../features/comments/CommentsSection';

interface HomePageProps {
  bearsState: BearsState;
  onRetry: () => void;
  query: string;
}

export function HomePage({
  bearsState,
  onRetry,
  query,
}: HomePageProps): ReactElement {
  return (
    <Article query={query}>
      <CommentsSection query={query} />
      <BearsSection state={bearsState} onRetry={onRetry} query={query} />
    </Article>
  );
}
