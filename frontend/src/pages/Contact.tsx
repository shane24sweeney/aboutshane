import { useState, type FormEvent } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { ContactError, sendContactMessage } from '../api/contact';
import './Contact.css';

type Status = { state: 'idle' } | { state: 'sending' } | { state: 'sent' } | { state: 'error'; message: string };

/** Fields the browser's `required` check lets through when they hold only spaces. */
type BlankField = 'name' | 'message';

function Contact() {
  const [status, setStatus] = useState<Status>({ state: 'idle' });
  const [blank, setBlank] = useState<Set<BlankField>>(new Set());

  const clearBlank = (field: BlankField) =>
    setBlank((current) => {
      if (!current.has(field)) return current;
      const next = new Set(current);
      next.delete(field);
      return next;
    });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();

    const blankFields = (['name', 'message'] as const).filter((field) => (field === 'name' ? name : message) === '');
    if (blankFields.length > 0) {
      setBlank(new Set(blankFields));
      setStatus({ state: 'idle' });
      form.querySelector<HTMLElement>(`[name="${blankFields[0]}"]`)?.focus();
      return;
    }

    setStatus({ state: 'sending' });
    try {
      await sendContactMessage({
        name,
        email: String(data.get('email') ?? '').trim(),
        message,
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
            <Form.Control
              name="name"
              type="text"
              placeholder="Your name..."
              autoComplete="name"
              maxLength={100}
              required
              isInvalid={blank.has('name')}
              aria-invalid={blank.has('name') || undefined}
              aria-describedby={blank.has('name') ? 'contact-name-error' : undefined}
              onChange={() => clearBlank('name')}
            />
            {blank.has('name') && (
              // Rendered only when needed and shown directly: WebKit (Safari) doesn't re-lay out
              // Bootstrap's `.is-invalid ~ .invalid-feedback` rule when the class is added later.
              <Form.Control.Feedback type="invalid" className="d-block" id="contact-name-error">
                Please enter your name.
              </Form.Control.Feedback>
            )}
          </Form.Group>
          <Form.Group className="mb-3" controlId="contact-email">
            <Form.Label>E-mail</Form.Label>
            <Form.Control name="email" type="email" placeholder="Your email..." autoComplete="email" maxLength={254} required />
          </Form.Group>
          <Form.Group className="mb-3" controlId="contact-message">
            <Form.Label>Message</Form.Label>
            <Form.Control
              name="message"
              as="textarea"
              rows={8}
              placeholder="Your message..."
              maxLength={5000}
              required
              isInvalid={blank.has('message')}
              aria-invalid={blank.has('message') || undefined}
              aria-describedby={blank.has('message') ? 'contact-message-error' : undefined}
              onChange={() => clearBlank('message')}
            />
            {blank.has('message') && (
              <Form.Control.Feedback type="invalid" className="d-block" id="contact-message-error">
                Please enter a message.
              </Form.Control.Feedback>
            )}
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
