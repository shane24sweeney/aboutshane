import React, { useState } from 'react';
import { Accordion, Container, Card, Image } from 'react-bootstrap';
import resume from '../resume/resume/resume';

const AccordionComponent = () => {
    const [activeKey, setActiveKey] = useState(null);

    const handleSelect = (eventKey) => {
      setActiveKey(activeKey === eventKey ? null : eventKey);
    };

    return (
      <Container className="resume-route py-4">
        <h1 className="visually-hidden">Professional Experience</h1>
        <Card bg="dark" text="white">
          <Card.Body>
            <Accordion activeKey={activeKey} onSelect={handleSelect}>
              {resume.map((item, index) => (
                <Accordion.Item key={index} eventKey={index.toString()} className="bg-dark text-white border-secondary">
                  <Accordion.Header className="bg-dark text-white">
                    <div className="d-flex align-items-center w-100">
                      <Image 
                        src={item.image} 
                        alt={`${item.title.split(' - ')[1]?.split(' (')[0] ?? item.title} logo`}
                        width={50} 
                        height={50} 
                        className="me-3" 
                        roundedCircle 
                      />
                      <span className="resume-title">{item.title}</span>
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
