import type { ReactElement } from 'react';
import type { NavLink } from './types';

interface RelatedLinksProps {
  links: readonly NavLink[];
}

export function RelatedLinks({ links }: RelatedLinksProps): ReactElement {
  return (
    <div className="secondary">
      <font size="6">Related</font>
      <ul>
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
