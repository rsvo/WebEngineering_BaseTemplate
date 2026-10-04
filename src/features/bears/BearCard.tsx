import { useState, type ReactElement } from 'react';
import { PLACEHOLDER_IMAGE } from '../../js/bears';
import type { BearWithImage } from '../../js/types';

interface BearCardProps {
  bear: BearWithImage;
}

export function BearCard({ bear }: BearCardProps): ReactElement {
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
        <b>{bear.name}</b> ({bear.binomial})
      </p>
      <p>Range: {bear.range}</p>
    </div>
  );
}
