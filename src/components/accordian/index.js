import React, { useState } from 'react';
import { Accordion, Container, Card, Image } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import resume from '../resume/resume/resume';

const AccordionComponent = () => {
    const [activeKey, setActiveKey] = useState(null);

    const handleSelect = (eventKey) => {
      setActiveKey(activeKey === eventKey ? null : eventKey);
    };

    return (
      <Container className="py-4" style={{ backgroundColor: 'black', color: 'white', minHeight: '100vh' }}>
        <Card bg="dark" text="white">
          <Card.Body>
            <Accordion activeKey={activeKey} onSelect={handleSelect}>
              {resume.map((item, index) => (
                <Accordion.Item key={index} eventKey={index.toString()} className="bg-dark text-white border-secondary">
                  <Accordion.Header className="bg-dark text-black">
                    <div className="d-flex align-items-center w-100">
                      <Image 
                        src={item.image} 
                        width={50} 
                        height={50} 
                        className="me-3" 
                        roundedCircle 
                      />
                      <span className="text-black">{item.title}</span>
                      <FontAwesomeIcon 
                        icon={faChevronDown} 
                        className={`ms-auto ${activeKey === index.toString() ? 'rotate-180' : ''}`} 
                        style={{ 
                          color: 'white',
                          transition: 'transform 0.3s ease',
                          transform: activeKey === index.toString() ? 'rotate(180deg)' : 'rotate(0deg)'
                        }} 
                      />
                    </div>
                  </Accordion.Header>
                  <Accordion.Body className="bg-dark text-white">
                    <p>{item.description}</p>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          </Card.Body>
        </Card>
      </Container>
    )
   };

   export default AccordionComponent;
