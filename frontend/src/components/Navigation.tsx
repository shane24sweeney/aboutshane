import type { IconType } from 'react-icons';
import {
  FaAddressBook,
  FaAddressCard,
  FaBuildingColumns,
  FaChess,
  FaHeart,
  FaHouse,
  FaMedal,
} from 'react-icons/fa6';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { NavLink } from 'react-router';
import './Navigation.css';

interface NavItem {
  to: string;
  label: string;
  icon: IconType;
}

const navItems: NavItem[] = [
  { to: '/home', label: 'Home', icon: FaHouse },
  { to: '/contact', label: 'Contact', icon: FaAddressCard },
  { to: '/about', label: 'About', icon: FaChess },
  { to: '/resume', label: 'Resume', icon: FaAddressBook },
  { to: '/testimonials', label: 'Testimonials', icon: FaMedal },
  { to: '/education', label: 'Education', icon: FaBuildingColumns },
  { to: '/charity', label: 'Charity Work', icon: FaHeart },
];

function Navigation() {
  return (
    <Navbar className="site-nav" bg="dark" variant="dark" aria-label="Primary navigation">
      <Nav className="site-nav-links mx-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Nav.Link key={to} as={NavLink} to={to} className="nav-button text-center" title={label} aria-label={label}>
            <Icon className="nav-icon" aria-hidden="true" />
            <span className="nav-label">{label}</span>
          </Nav.Link>
        ))}
      </Nav>
    </Navbar>
  );
}

export default Navigation;
