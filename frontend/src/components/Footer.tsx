import { Link } from 'react-router';
import { NAV_GROUPS } from '../navigation';
import { OPEN_COOKIE_SETTINGS } from './ConsentBanner';
import StatusBadge from './StatusBadge';
import './Footer.css';

// No email address here: scrapers harvest mailto links, and the contact form is the protected route.
function Footer() {
  return (
    <footer className="site-footer">
      {/* A site map: every page, grouped as in the navigation, for anyone scanning. */}
      <nav className="site-footer-map" aria-label="All pages">
        {NAV_GROUPS.filter((group) => group.pages.length > 1).map((group) => (
          <div key={group.label}>
            <p className="site-footer-map-title" aria-hidden="true">
              {group.label}
            </p>
            <ul aria-label={group.label}>
              {group.pages.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <ul className="site-footer-group">
        <li>© {new Date().getFullYear()} Shane James Sweeney</li>
        <li>Kennesaw, GA</li>
      </ul>
      <ul className="site-footer-group">
        <li>
          <a href="https://linkedin.com/in/shane-sweeney-37a934135" target="_blank" rel="noreferrer">
            LinkedIn
          </a>
        </li>
        <li>
          <a href="https://github.com/shane24sweeney" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </li>
        <li>
          <Link to="/contact">Contact</Link>
        </li>
        <li>
          <button type="button" className="site-footer-link" onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS))}>
            Cookie settings
          </button>
        </li>
      </ul>
      <div className="site-footer-status">
        <StatusBadge />
      </div>
    </footer>
  );
}

export default Footer;
