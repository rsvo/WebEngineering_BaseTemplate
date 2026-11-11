import type { ReactElement } from 'react';
import { Link } from 'react-router';
import { Highlight } from '../search/Highlight';
import { BearImage } from './BearImage';
import type { Bear } from './types';

interface BearCardProps {
  bear: Bear;
  query: string;
}

export function BearCard({ bear, query }: BearCardProps): ReactElement {
  return (
    <div className="bear">
      <BearImage src={bear.imageUrl} alt={`Image of ${bear.name}`} />
      <p>
        <b>
          <Link to={`/bears/${bear.id}`}>
            <Highlight text={bear.name} query={query} />
          </Link>
        </b>
        <Highlight text={` (${bear.binomial})`} query={query} />
      </p>
      <p>
        <Highlight text={`Range: ${bear.range}`} query={query} />
      </p>
    </div>
  );
}
