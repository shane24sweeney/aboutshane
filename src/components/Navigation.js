import React from 'react';
import {  Nav, NavbarBrand} from 'reactstrap';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faHome,   faAddressCard,  faChess, faAddressBook, faUniversity, faMedal, faHeart } from '@fortawesome/free-solid-svg-icons';


function Navigation() {

  return (
    <div  >
        <div className="container-fluid"  >
            <Nav className="justify-content-center" >
            <NavbarBrand>
            <NavLink to="/home" className="nav-link" style={{color:'white'}}>
            <FontAwesomeIcon icon={faHome}  size='2x' style={{color:'white'}}
            vertical color={'black'} />Home </NavLink> 
              
              </NavbarBrand>
              <NavbarBrand>
                <NavLink to="/contact" className="nav-link" style={{color:'white'}}>
                <FontAwesomeIcon icon={faAddressCard} size='2x' style={{color:'white'}}
            vertical color={'black'} /> Contact 
                </NavLink>
              </NavbarBrand>
              <NavbarBrand>
                <NavLink to="/about" className="nav-link" style={{color:'white'}}>
                <FontAwesomeIcon icon={faChess} size='2x' style={{color:'white'}}
            vertical color={'black'} />  About 
                </NavLink>
              </NavbarBrand>
              <NavbarBrand>
                <NavLink to="/resume" className="nav-link" style={{color:'white'}}>
                <FontAwesomeIcon icon={faAddressBook} size='2x' style={{color:'white'}}
            vertical color={'black'} /> Resume 
                </NavLink>
              </NavbarBrand>
              <NavbarBrand>
                <NavLink to="/testimonials" className="nav-link" style={{color:'white'}}>
                <FontAwesomeIcon icon={faMedal} size='2x' style={{color:'white'}}
            vertical color={'black'} /> Testimonials 
                  </NavLink>
              </NavbarBrand>
              <NavbarBrand>
                <NavLink to="/education" className="nav-link" style={{color:'white'}}>
                <FontAwesomeIcon icon={faUniversity} size='2x' style={{color:'white'}}
            vertical color={'black'} />Education 
                </NavLink>
              </NavbarBrand>
              <NavbarBrand>
                <NavLink to="/charity" className="nav-link" style={{color:'white'}}>
                <FontAwesomeIcon icon={faHeart} size='2x' style={{color:'white'}}
            vertical color={'black'} /> Charity Work 
                  </NavLink>
              </NavbarBrand>
            </Nav>
           

        </div>
      
    
    </div>
  
  )
  
}

export default Navigation;