import { Link } from 'react-router';
import { OPEN_COOKIE_SETTINGS } from './ConsentBanner';
import StatusBadge from './StatusBadge';
import './Footer.css';

// No email address here: scrapers harvest mailto links, and the contact form is the protected route.
function Footer() {
  return (
    <footer className="site-footer">
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
