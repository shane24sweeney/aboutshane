import React from 'react';
import {  Nav, NavbarBrand} from 'reactstrap';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faHome,   faAddressCard,  faChess, faMars, faUniversity, faMedal, faHeart } from '@fortawesome/free-solid-svg-icons';


function Navigation() {

  return (
    <div  >
        <div className="container-fluid"  >
            <Nav className="justify-content-center" >
            <NavbarBrand>
            <NavLink to="/home" className="nav-link">
            <FontAwesomeIcon icon={faHome} 
            vertical color={'black'} />Home </NavLink> 
              
              </NavbarBrand>
              <NavbarBrand>
                <NavLink to="/contact" className="nav-link">
                <FontAwesomeIcon icon={faAddressCard} 
            vertical color={'black'} /> Contact 
                </NavLink>
              </NavbarBrand>
              <NavbarBrand>
                <NavLink to="/about" className="nav-link">
                <FontAwesomeIcon icon={faChess} 
            vertical color={'black'} />  About 
                </NavLink>
              </NavbarBrand>
              <NavbarBrand>
                <NavLink to="/resume" className="nav-link">
                <FontAwesomeIcon icon={faMars} 
            vertical color={'black'} /> Resume 
                </NavLink>
              </NavbarBrand>
              <NavbarBrand>
                <NavLink to="/testimonials" className="nav-link">
                <FontAwesomeIcon icon={faMedal} 
            vertical color={'black'} /> Testimonials 
                  </NavLink>
              </NavbarBrand>
              <NavbarBrand>
                <NavLink to="/education" className="nav-link">
                <FontAwesomeIcon icon={faUniversity} 
            vertical color={'black'} />Education 
                </NavLink>
              </NavbarBrand>
              <NavbarBrand>
                <NavLink to="/charity" className="nav-link">
                <FontAwesomeIcon icon={faHeart} 
            vertical color={'black'} /> Charity Work 
                  </NavLink>
              </NavbarBrand>
            </Nav>
           

        </div>
      
    
    </div>
  
  )
  
}

export default Navigation;