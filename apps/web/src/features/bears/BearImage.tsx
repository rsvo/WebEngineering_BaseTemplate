import { useState, type ReactElement } from 'react';
import { PLACEHOLDER_IMAGE } from './constants';

interface BearImageProps {
  // null when the API could not resolve an image for this bear.
  src: string | null;
  alt: string;
}

export function BearImage({ src, alt }: BearImageProps): ReactElement {
  const [failed, setFailed] = useState(false);

  return (
    <img
      src={failed || src === null ? PLACEHOLDER_IMAGE : src}
      alt={alt}
      onError={() => {
        setFailed(true);
      }}
    />
  );
}
