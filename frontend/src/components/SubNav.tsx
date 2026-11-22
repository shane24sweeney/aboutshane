import { NavLink, useLocation } from 'react-router';
import { groupFor } from '../navigation';
import { prefetchPage } from '../prefetch';
import './SubNav.css';

/** The current group's pages as sub-tabs (Résumé · Education · Testimonials, ...). */
function SubNav() {
  const group = groupFor(useLocation().pathname);
  if (!group || group.pages.length < 2) return null;

  return (
    <nav className="sub-nav" aria-label={`${group.label} pages`}>
      <ul>
        {group.pages.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) => `sub-nav-link${isActive ? ' active' : ''}`}
              onPointerEnter={() => prefetchPage(to, { intent: true })}
              onFocus={() => prefetchPage(to, { intent: true })}
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default SubNav;
