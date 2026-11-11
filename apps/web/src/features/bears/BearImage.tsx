import { useState, type ReactElement } from 'react';
import { PLACEHOLDER_IMAGE } from './constants';

interface BearImageProps {
  src: string;
  alt: string;
}

export function BearImage({ src, alt }: BearImageProps): ReactElement {
  const [failed, setFailed] = useState(false);

  return (
    <img
      src={failed ? PLACEHOLDER_IMAGE : src}
      alt={alt}
      onError={() => {
        setFailed(true);
      }}
    />
  );
}
