import type { ReactElement } from 'react';
import type { Bear } from './types';
import { BearCard } from './BearCard';

interface BearListProps {
  bears: readonly Bear[];
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
