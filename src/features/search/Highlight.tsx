import { Fragment, type ReactElement } from 'react';
import { splitByQuery } from './highlight';

interface HighlightProps {
  text: string;
  query: string;
}

export function Highlight({ text, query }: HighlightProps): ReactElement {
  return (
    <>
      {splitByQuery(text, query).map((part, index) =>
        part.isMatch ? (
          // The parts are derived from text and query and are never
          // reordered, so the position identifies them.
          <mark key={index} className="highlight">
            {part.text}
          </mark>
        ) : (
          <Fragment key={index}>{part.text}</Fragment>
        )
      )}
    </>
  );
}
