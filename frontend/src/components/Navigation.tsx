import type { CSSProperties } from 'react';
import type { IconType } from 'react-icons';
import {
  FaBriefcase,
  FaEnvelope,
  FaGraduationCap,
  FaHandHoldingHeart,
  FaHouse,
  FaPersonRunning,
  FaQuoteLeft,
  FaUser,
} from 'react-icons/fa6';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { NavLink } from 'react-router';
import './Navigation.css';

interface NavItem {
  to: string;
  label: string;
  icon: IconType;
  /** The colour of the icon's 3D tile. */
  colour: string;
}

const navItems: NavItem[] = [
  { to: '/home', label: 'Home', icon: FaHouse, colour: '#79d2c0' },
  { to: '/contact', label: 'Contact', icon: FaEnvelope, colour: '#ff9f80' },
  { to: '/about', label: 'About', icon: FaUser, colour: '#f5c86b' },
  { to: '/resume', label: 'Resume', icon: FaBriefcase, colour: '#83b9ff' },
  { to: '/testimonials', label: 'Testimonials', icon: FaQuoteLeft, colour: '#f2a7d5' },
  { to: '/education', label: 'Education', icon: FaGraduationCap, colour: '#b6a1ff' },
  { to: '/charity', label: 'Charity Work', icon: FaHandHoldingHeart, colour: '#ff8fa3' },
  { to: '/running', label: 'Running', icon: FaPersonRunning, colour: '#8fe388' },
];

function Navigation() {
  return (
    <Navbar className="site-nav" bg="dark" variant="dark" aria-label="Primary navigation">
      <Nav className="site-nav-links mx-auto">
        {navItems.map(({ to, label, icon: Icon, colour }) => (
          <Nav.Link key={to} as={NavLink} to={to} className="nav-button text-center" title={label} aria-label={label}>
            <span className="nav-tile" style={{ '--tile': colour } as CSSProperties} aria-hidden="true">
              <Icon className="nav-icon" />
            </span>
            <span className="nav-label">{label}</span>
          </Nav.Link>
        ))}
      </Nav>
    </Navbar>
  );
}

export default Navigation;
