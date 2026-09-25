export interface ContactMessage {
  name: string;
  email: string;
  message: string;
  /** Honeypot: hidden from people, so only bots fill it in. */
  website: string;
}

export class ContactError extends Error {}

/** Sends a message to the contact API, which CloudFront serves from the same origin. */
export async function sendContactMessage(contact: ContactMessage, signal?: AbortSignal): Promise<void> {
  let response: Response;
  try {
    response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact),
      signal,
    });
  } catch {
    throw new ContactError('Could not reach the server. Please check your connection and try again.');
  }

  if (response.status === 429) {
    throw new ContactError('Too many messages right now. Please try again in a minute.');
  }
  if (!response.ok) {
    throw new ContactError('Your message could not be sent. Please try again, or email me directly.');
  }
}
