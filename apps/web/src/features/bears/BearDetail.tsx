import type { ReactElement } from 'react';
import { Link } from 'react-router';
import { Highlight } from '../search/Highlight';
import { BearImage } from './BearImage';
import type { BearWithImage } from './types';

interface BearDetailProps {
  bear: BearWithImage;
  query: string;
}

export function BearDetail({ bear, query }: BearDetailProps): ReactElement {
  return (
    <>
      <font size="6">
        <Highlight text={bear.name} query={query} />
      </font>
      <BearImage src={bear.image} alt={`Image of ${bear.name}`} />
      <p>
        <b>
          <Highlight text="Scientific name: " query={query} />
        </b>
        <Highlight text={bear.binomial} query={query} />
      </p>
      <p>
        <b>
          <Highlight text="Range: " query={query} />
        </b>
        <Highlight text={bear.range} query={query} />
      </p>
      <p>
        <Link to="/">Back to all bears</Link>
      </p>
    </>
  );
}
