import type { DetailedHTMLProps, HTMLAttributes } from 'react';

// The legacy markup still uses the deprecated <font> element, which React's
// JSX typings do not know about. The CSS targets it via font[size], so it is
// kept as is until the markup is redesigned.
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      font: DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & { size?: string },
        HTMLElement
      >;
    }
  }
}
