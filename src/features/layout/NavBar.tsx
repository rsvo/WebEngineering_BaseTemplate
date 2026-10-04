import type { ReactElement, ReactNode } from 'react';
import type { NavLink } from './types';

interface NavBarProps {
  links: readonly NavLink[];
  children?: ReactNode;
}

export function NavBar({ links, children }: NavBarProps): ReactElement {
  return (
    <div className="nav">
      <ul>
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
}
