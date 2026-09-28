import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import Contact from '../../frontend/src/pages/Contact';

async function fillAndSubmit() {
  const user = userEvent.setup();
  render(<Contact />);
  await user.type(screen.getByLabelText('Name'), '  Jane Doe ');
  await user.type(screen.getByLabelText('E-mail'), 'jane@example.com');
  await user.type(screen.getByLabelText('Message'), 'Hello from a test');
  await user.click(screen.getByRole('button', { name: 'Submit' }));
}

describe('Contact page', () => {
  it('posts the trimmed message as JSON and confirms it was sent', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);

    await fillAndSubmit();

    expect(await screen.findByRole('status')).toHaveTextContent('Your message was sent');
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/contact');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'Hello from a test',
      website: '',
    });
    expect(screen.getByLabelText('Name')).toHaveValue('');
  });

  it('disables the button while sending', async () => {
    let finish: (response: Response) => void = () => {};
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => (finish = resolve))));
    await fillAndSubmit();
    expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled();
    finish(new Response(null, { status: 202 }));
    expect(await screen.findByRole('button', { name: 'Submit' })).toBeEnabled();
  });

  describe('when sending goes wrong', { tags: ['negative'] }, () => {
    it('shows a rate-limit message when the API returns 429', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 429 })));
      await fillAndSubmit();
      expect(await screen.findByRole('alert')).toHaveTextContent('Too many messages');
      expect(screen.getByLabelText('Name')).toHaveValue('  Jane Doe ');
    });

    it('shows an error when the API fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
      await fillAndSubmit();
      expect(await screen.findByRole('alert')).toHaveTextContent('could not be sent');
    });

    it('shows an error when the network is unreachable', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
      await fillAndSubmit();
      expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the server');
    });

    it('shows an error and keeps the text when the API rejects the message as invalid', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ error: 'validation_failed', fields: { email: 'must be a well-formed email address' } }), {
            status: 400,
          }),
        ),
      );
      await fillAndSubmit();
      expect(await screen.findByRole('alert')).toHaveTextContent('could not be sent');
      expect(screen.queryByRole('status')).toBeNull();
      expect(screen.getByLabelText('Message')).toHaveValue('Hello from a test');
    });

    it('sends whitespace-only fields as empty, so the API rejects them instead of reporting success', async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 400 }));
      vi.stubGlobal('fetch', fetchMock);
      const user = userEvent.setup();
      render(<Contact />);
      await user.type(screen.getByLabelText('Name'), '   ');
      await user.type(screen.getByLabelText('E-mail'), 'jane@example.com');
      await user.type(screen.getByLabelText('Message'), '   ');
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('could not be sent');
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(JSON.parse(init.body as string)).toMatchObject({ name: '', message: '' });
    });

    it('lets the visitor try again after an error', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(null, { status: 500 }))
        .mockResolvedValueOnce(new Response(null, { status: 202 }));
      vi.stubGlobal('fetch', fetchMock);
      await fillAndSubmit();
      expect(await screen.findByRole('alert')).toBeInTheDocument();

      await userEvent.setup().click(screen.getByRole('button', { name: 'Submit' }));
      expect(await screen.findByRole('status')).toHaveTextContent('Your message was sent');
      expect(screen.queryByRole('alert')).toBeNull();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('hides the spam honeypot from assistive technology and keyboard users', () => {
      render(<Contact />);
      const honeypot = document.querySelector<HTMLInputElement>('input[name="website"]');
      expect(honeypot).not.toBeNull();
      expect(honeypot?.tabIndex).toBe(-1);
      expect(honeypot?.closest('[aria-hidden="true"]')).not.toBeNull();
    });
  });
});
