import { useState, type ReactElement } from 'react';
import { Highlight } from '../search/Highlight';
import { PLACEHOLDER_IMAGE } from './constants';
import type { BearWithImage } from './types';

interface BearCardProps {
  bear: BearWithImage;
  query: string;
}

export function BearCard({ bear, query }: BearCardProps): ReactElement {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="bear">
      <img
        src={imageFailed ? PLACEHOLDER_IMAGE : bear.image}
        alt={`Image of ${bear.name}`}
        onError={() => {
          setImageFailed(true);
        }}
      />
      <p>
        <b>
          <Highlight text={bear.name} query={query} />
        </b>
        <Highlight text={` (${bear.binomial})`} query={query} />
      </p>
      <p>
        <Highlight text={`Range: ${bear.range}`} query={query} />
      </p>
    </div>
  );
}
