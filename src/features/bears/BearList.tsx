import type { ReactElement } from 'react';
import type { BearWithImage } from './types';
import { BearCard } from './BearCard';

interface BearListProps {
  bears: readonly BearWithImage[];
  query: string;
}

export function BearList({ bears, query }: BearListProps): ReactElement {
  return (
    <>
      {bears.map((bear) => (
        <BearCard key={bear.id} bear={bear} query={query} />
      ))}
    </>
  );
}
