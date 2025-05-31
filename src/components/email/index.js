import React from "react";
import { Form, Button, Container, Row, Col, Card } from 'react-bootstrap';
import emailjs from "emailjs-com";



const SERVICE_ID = "service_p5dpxp5";
const TEMPLATE_ID = "template_ye4bn4a";
const PUBLIC_KEY = "user_dheSXAbJ2Qf4yl2w7Fj62";


const Email = () => {
  const handleOnSubmit = (e) => {
      e.preventDefault();
      emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, e.target, PUBLIC_KEY)
        .then((result) => {
          console.log(result.text);
          alert('Message Sent Successfully')
        }, (error) => {
          console.log(error.text);
          alert('Something went wrong!')
        });
      e.target.reset()
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
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    id="from_name"
                    name="from_name"
                    placeholder="Your name..."
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>E-mail</Form.Label>
                  <Form.Control
                    type="email"
                    id="from_email"
                    name="from_email"
                    placeholder="Your email..."
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Message</Form.Label>
                  <Form.Control
                    as="textarea"
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
  )
}
export default Email
