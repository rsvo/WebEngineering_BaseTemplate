import type { ReactElement } from 'react';
import type { BearWithImage } from '../../js/types';
import { BearCard } from './BearCard';

interface BearListProps {
  bears: readonly BearWithImage[];
}

export function BearList({ bears }: BearListProps): ReactElement {
  return (
    <>
      {bears.map((bear) => (
        <BearCard key={bear.binomial} bear={bear} />
      ))}
    </>
  );
}
