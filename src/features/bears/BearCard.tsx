import { useState, type ReactElement } from 'react';
import { PLACEHOLDER_IMAGE } from '../../js/bears';
import type { BearWithImage } from '../../js/types';
import { Highlight } from '../search/Highlight';

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
