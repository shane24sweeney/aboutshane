import React from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faHome,   faAddressCard,  faChess, faAddressBook, faUniversity, faMedal, faHeart } from '@fortawesome/free-solid-svg-icons';


function Navigation() {

  return (
    <div>
      <Navbar className="site-nav" bg="dark" variant="dark">
        <Nav className="site-nav-links mx-auto">
            <Nav.Link as={NavLink} to="/home" className="text-center" title="Home" aria-label="Home">
              <FontAwesomeIcon icon={faHome} size='2x' style={{ color: 'white' }} />
              <span className="nav-label">Home</span>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/contact" className="text-center" title="Contact" aria-label="Contact">
              <FontAwesomeIcon icon={faAddressCard} size='2x' style={{ color: 'white' }} />
              <span className="nav-label">Contact</span>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/about" className="text-center" title="About" aria-label="About">
              <FontAwesomeIcon icon={faChess} size='2x' style={{ color: 'white' }} />
              <span className="nav-label">About</span>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/resume" className="text-center" title="Resume" aria-label="Resume">
              <FontAwesomeIcon icon={faAddressBook} size='2x' style={{ color: 'white' }} />
              <span className="nav-label">Resume</span>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/testimonials" className="text-center" title="Testimonials" aria-label="Testimonials">
              <FontAwesomeIcon icon={faMedal} size='2x' style={{ color: 'white' }} />
              <span className="nav-label">Testimonials</span>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/education" className="text-center" title="Education" aria-label="Education">
              <FontAwesomeIcon icon={faUniversity} size='2x' style={{ color: 'white' }} />
              <span className="nav-label">Education</span>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/charity" className="text-center" title="Charity Work" aria-label="Charity Work">
              <FontAwesomeIcon icon={faHeart} size='2x' style={{ color: 'white' }} />
              <span className="nav-label">Charity Work</span>
            </Nav.Link>
        </Nav>
      </Navbar>
    </div>
  )
}

export default Navigation;
