import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router';
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
            {link.href.startsWith('/') ? (
              <Link to={link.href}>{link.label}</Link>
            ) : (
              <a href={link.href}>{link.label}</a>
            )}
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
}
