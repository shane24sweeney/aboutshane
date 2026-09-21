import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import emailjs from 'emailjs-com';
import Email from './components/email/index.js';
import { SiteProvider } from './context/SiteContext';

describe('Email form configuration', () => {
  const originalEnv = process.env;
  const originalAlert = window.alert;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      REACT_APP_EMAILJS_SERVICE_ID: 'env_service_id',
      REACT_APP_EMAILJS_TEMPLATE_ID: 'env_template_id',
      REACT_APP_EMAILJS_PUBLIC_KEY: 'env_public_key',
    };
    emailjs.sendForm = jest.fn(() => Promise.resolve({ text: 'OK' }));
    window.alert = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
    window.alert = originalAlert;
  });

  test('uses environment variables when submitting the form', async () => {
    render(
      <SiteProvider>
        <Email />
      </SiteProvider>
    );

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Jane Doe', name: 'from_name' } });
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'jane@example.com', name: 'from_email' } });
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Hello from a test', name: 'message' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(emailjs.sendForm).toHaveBeenCalledWith(
        'env_service_id',
        'env_template_id',
        expect.any(HTMLFormElement),
        'env_public_key'
      );
    });
  });
});
