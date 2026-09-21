import React from 'react';
import { Form, Button, Container, Row, Col, Card } from 'react-bootstrap';
import emailjs from 'emailjs-com';
import { useSiteContext } from '../../context/SiteContext';

const Email = () => {
  const { emailjs: { serviceId, templateId, publicKey } } = useSiteContext();

  const handleOnSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    emailjs.sendForm(serviceId, templateId, form, publicKey)
      .then((result) => {
        console.log(result.text);
        alert('Message Sent Successfully');
      }, (error) => {
        console.log(error.text);
        alert('Something went wrong!');
      });
    form.reset();
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Row className="justify-content-center">
        <Col xs={12} md={8} lg={6}>
          <Card bg="dark" text="white" className="p-4">
            <Card.Body>
              <h2 className="text-center mb-4">Send me a message. Let's have a chat!</h2>
              <Form onSubmit={handleOnSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label htmlFor="from_name">Name</Form.Label>
                  <Form.Control
                    type="text"
                    id="from_name"
                    name="from_name"
                    placeholder="Your name..."
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label htmlFor="from_email">E-mail</Form.Label>
                  <Form.Control
                    type="email"
                    id="from_email"
                    name="from_email"
                    placeholder="Your email..."
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label htmlFor="message">Message</Form.Label>
                  <Form.Control
                    as="textarea"
                    id="message"
                    name="message"
                    placeholder="Your message..."
                    rows={8}
                    required
                  />
                </Form.Group>
                <Button variant="primary" type="submit" className="w-100">Submit</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Email;
