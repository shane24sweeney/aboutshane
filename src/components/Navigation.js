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
            <NavLink to="/home" className="nav-link" style={{color:'white'}}>
            <FontAwesomeIcon icon={faHome} style={{color:'white'}}
            vertical color={'black'} />Home </NavLink> 
              
              </NavbarBrand>
              <NavbarBrand>
                <NavLink to="/contact" className="nav-link" style={{color:'white'}}>
                <FontAwesomeIcon icon={faAddressCard} style={{color:'white'}}
            vertical color={'black'} /> Contact 
                </NavLink>
              </NavbarBrand>
              <NavbarBrand>
                <NavLink to="/about" className="nav-link" style={{color:'white'}}>
                <FontAwesomeIcon icon={faChess} style={{color:'white'}}
            vertical color={'black'} />  About 
                </NavLink>
              </NavbarBrand>
              <NavbarBrand>
                <NavLink to="/resume" className="nav-link" style={{color:'white'}}>
                <FontAwesomeIcon icon={faMars} style={{color:'white'}}
            vertical color={'black'} /> Resume 
                </NavLink>
              </NavbarBrand>
              <NavbarBrand>
                <NavLink to="/testimonials" className="nav-link" style={{color:'white'}}>
                <FontAwesomeIcon icon={faMedal} style={{color:'white'}}
            vertical color={'black'} /> Testimonials 
                  </NavLink>
              </NavbarBrand>
              <NavbarBrand>
                <NavLink to="/education" className="nav-link" style={{color:'white'}}>
                <FontAwesomeIcon icon={faUniversity} style={{color:'white'}}
            vertical color={'black'} />Education 
                </NavLink>
              </NavbarBrand>
              <NavbarBrand>
                <NavLink to="/charity" className="nav-link" style={{color:'white'}}>
                <FontAwesomeIcon icon={faHeart} style={{color:'white'}}
            vertical color={'black'} /> Charity Work 
                  </NavLink>
              </NavbarBrand>
            </Nav>
           

        </div>
      
    
    </div>
  
  )
  
}

export default Navigation;