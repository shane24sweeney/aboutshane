import React from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faHome,   faAddressCard,  faChess, faAddressBook, faUniversity, faMedal, faHeart } from '@fortawesome/free-solid-svg-icons';


function Navigation() {

  return (
    <div>
      <Navbar bg="dark" variant="dark" expand={true}>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mx-auto flex-row">
            <Nav.Link as={NavLink} to="/home" className="text-center mx-2">
              <FontAwesomeIcon icon={faHome} size='2x' style={{ color: 'white' }} />
              <div style={{ marginTop: '5px', color: 'white' }}>Home</div>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/contact" className="text-center mx-2">
              <FontAwesomeIcon icon={faAddressCard} size='2x' style={{ color: 'white' }} />
              <div style={{ marginTop: '5px', color: 'white' }}>Contact</div>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/about" className="text-center mx-2">
              <FontAwesomeIcon icon={faChess} size='2x' style={{ color: 'white' }} />
              <div style={{ marginTop: '5px', color: 'white' }}>About</div>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/resume" className="text-center mx-2">
              <FontAwesomeIcon icon={faAddressBook} size='2x' style={{ color: 'white' }} />
              <div style={{ marginTop: '5px', color: 'white' }}>Resume</div>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/testimonials" className="text-center mx-2">
              <FontAwesomeIcon icon={faMedal} size='2x' style={{ color: 'white' }} />
              <div style={{ marginTop: '5px', color: 'white' }}>Testimonials</div>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/education" className="text-center mx-2">
              <FontAwesomeIcon icon={faUniversity} size='2x' style={{ color: 'white' }} />
              <div style={{ marginTop: '5px', color: 'white' }}>Education</div>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/charity" className="text-center mx-2">
              <FontAwesomeIcon icon={faHeart} size='2x' style={{ color: 'white' }} />
              <div style={{ marginTop: '5px', color: 'white' }}>Charity Work</div>
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    </div>
  )
}

export default Navigation;
