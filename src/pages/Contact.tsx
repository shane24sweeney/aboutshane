import { useState, type FormEvent } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { ContactError, sendContactMessage } from '../api/contact';
import './Contact.css';

type Status = { state: 'idle' } | { state: 'sending' } | { state: 'sent' } | { state: 'error'; message: string };

function Contact() {
  const [status, setStatus] = useState<Status>({ state: 'idle' });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus({ state: 'sending' });
    try {
      await sendContactMessage({
        name: String(data.get('name') ?? '').trim(),
        email: String(data.get('email') ?? '').trim(),
        message: String(data.get('message') ?? '').trim(),
        website: String(data.get('website') ?? ''),
      });
      form.reset();
      setStatus({ state: 'sent' });
    } catch (error) {
      const message = error instanceof ContactError ? error.message : 'Something went wrong. Please try again.';
      setStatus({ state: 'error', message });
    }
  };

  const sending = status.state === 'sending';

  return (
    <div className="contact-page">
      <div className="contact-card">
        <div className="contact-accent" aria-hidden="true" />
        <h1 className="contact-title">Send me a message.</h1>
        <p className="contact-intro">Let&apos;s talk about quality engineering, automation, or your next project.</p>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="contact-name">
            <Form.Label>Name</Form.Label>
            <Form.Control name="name" type="text" placeholder="Your name..." autoComplete="name" maxLength={100} required />
          </Form.Group>
          <Form.Group className="mb-3" controlId="contact-email">
            <Form.Label>E-mail</Form.Label>
            <Form.Control name="email" type="email" placeholder="Your email..." autoComplete="email" maxLength={254} required />
          </Form.Group>
          <Form.Group className="mb-3" controlId="contact-message">
            <Form.Label>Message</Form.Label>
            <Form.Control name="message" as="textarea" rows={8} placeholder="Your message..." maxLength={5000} required />
          </Form.Group>
          <div className="contact-honeypot" aria-hidden="true">
            <label htmlFor="contact-website">Website</label>
            <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <Button type="submit" className="contact-submit w-100" disabled={sending}>
            {sending ? 'Sending...' : 'Submit'}
          </Button>

          <div className="contact-status" aria-live="polite">
            {status.state === 'sent' && (
              <p className="contact-status-success" role="status">
                Thanks! Your message was sent. I&apos;ll get back to you soon.
              </p>
            )}
            {status.state === 'error' && (
              <p className="contact-status-error" role="alert">
                {status.message}
              </p>
            )}
          </div>
        </Form>
      </div>
    </div>
  );
}

export default Contact;
