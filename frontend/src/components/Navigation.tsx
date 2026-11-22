import type { CSSProperties } from 'react';
import { Link, useLocation } from 'react-router';
import { groupFor, NAV_GROUPS } from '../navigation';
import { prefetchPage } from '../prefetch';
import './Navigation.css';

/**
 * The five groups as glossy 3D tiles: a bar along the top on wide screens (with Contact as a
 * "Contact me" button) and a fixed bar along the bottom on phones, within thumb reach. A group's
 * tile stays highlighted on all of its pages; SubNav switches between them.
 */
function Navigation() {
  const current = groupFor(useLocation().pathname);

  return (
    <nav className="site-nav" aria-label="Primary navigation">
      <ul className="site-nav-links">
        {NAV_GROUPS.map((group) => {
          const { to, label, icon: Icon, colour, callToAction } = group;
          const active = group === current;
          // Start loading the page the moment a finger, mouse or keyboard reaches its tile.
          const prefetch = () => prefetchPage(to, { intent: true });
          return (
            <li key={to}>
              <Link
                to={to}
                className={`nav-link nav-button${active ? ' active' : ''}${callToAction ? ' nav-cta' : ''}`}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                onPointerEnter={prefetch}
                onPointerDown={prefetch}
                onFocus={prefetch}
              >
                <span className="nav-tile" style={{ '--tile': colour } as CSSProperties} aria-hidden="true">
                  <Icon className="nav-icon" />
                </span>
                <span className="nav-label">{label}</span>
                {callToAction && <span className="nav-cta-label">{label} me</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default Navigation;
