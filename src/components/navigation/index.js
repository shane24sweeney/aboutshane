import React from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faHome,   faAddressCard,  faChess, faAddressBook, faUniversity, faMedal, faHeart } from '@fortawesome/free-solid-svg-icons';


function Navigation() {

  return (
    <div>
      <Navbar className="site-nav" bg="dark" variant="dark">
        <Nav className="site-nav-links mx-auto" aria-label="Primary navigation">
            <Nav.Link as={NavLink} to="/home" className="nav-button text-center" title="Home" aria-label="Home">
              <FontAwesomeIcon className="nav-icon" icon={faHome} size='2x' />
              <span className="nav-label">Home</span>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/contact" className="nav-button text-center" title="Contact" aria-label="Contact">
              <FontAwesomeIcon className="nav-icon" icon={faAddressCard} size='2x' />
              <span className="nav-label">Contact</span>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/about" className="nav-button text-center" title="About" aria-label="About">
              <FontAwesomeIcon className="nav-icon" icon={faChess} size='2x' />
              <span className="nav-label">About</span>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/resume" className="nav-button text-center" title="Resume" aria-label="Resume">
              <FontAwesomeIcon className="nav-icon" icon={faAddressBook} size='2x' />
              <span className="nav-label">Resume</span>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/testimonials" className="nav-button text-center" title="Testimonials" aria-label="Testimonials">
              <FontAwesomeIcon className="nav-icon" icon={faMedal} size='2x' />
              <span className="nav-label">Testimonials</span>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/education" className="nav-button text-center" title="Education" aria-label="Education">
              <FontAwesomeIcon className="nav-icon" icon={faUniversity} size='2x' />
              <span className="nav-label">Education</span>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/charity" className="nav-button text-center" title="Charity Work" aria-label="Charity Work">
              <FontAwesomeIcon className="nav-icon" icon={faHeart} size='2x' />
              <span className="nav-label">Charity Work</span>
            </Nav.Link>
        </Nav>
      </Navbar>
    </div>
  )
}

export default Navigation;
