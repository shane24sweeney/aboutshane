import { type APIResponse, expect, test } from '@playwright/test';
import { pages } from '../support/pages';
import { and, given, then, when } from '../support/steps';

// Read-only checks against the live site. Nothing here submits the contact form.

test.describe('production smoke', () => {
  for (const { path, heading } of pages) {
    test(`${path} is up`, async ({ page }) => {
      await given('the live site', () => {});
      const response = await when(`a visitor opens ${path}`, () => page.goto(path));
      await then('the page loads with its heading', async () => {
        expect(response?.status()).toBe(200);
        await expect(page.getByRole('heading', { level: 1, name: heading })).toBeAttached();
      });
    });
  }

  test('serves HTTPS with security headers', async ({ request }) => {
    await given('the live site', () => {});
    const response = await when('the home page is requested', () => request.get('/home'));
    await then('it sends HSTS, nosniff and same-origin framing headers', () => {
      const headers = response.headers();
      expect(headers['strict-transport-security']).toContain('max-age=');
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-frame-options']).toBe('SAMEORIGIN');
    });
  });

  test('contact API is healthy', async ({ request }) => {
    await given('the live API', () => {});
    const response = await when('its health check is requested', () => request.get('/api/health'));
    await then('it reports ok', async () => {
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual({ status: 'ok' });
    });
  });

  test('contact API validates input without sending anything', { tag: '@negative' }, async ({ request }) => {
    await given('the live contact API', () => {});
    const response = await when('a message with a blank name and message and an invalid email is posted', () =>
      request.post('/api/contact', { data: { name: '', email: 'not-an-email', message: '', website: '' } }),
    );
    await then('it is rejected with 400, naming each invalid field', async () => {
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('validation_failed');
      expect(Object.keys(body.fields).sort()).toEqual(['email', 'message', 'name']);
    });
  });

  for (const [api, minimumEntries] of [['resume', 9], ['testimonials', 11], ['education', 3], ['charity', 5]] as const) {
    test(`content API serves ${api} with edge caching`, async ({ request }) => {
      await given('the live content API', () => {});
      const response = await when(`/api/content/${api} is requested`, () => request.get(`/api/content/${api}`));
      await then(`it returns at least ${minimumEntries} entries`, async () => {
        expect(response.status()).toBe(200);
        expect((await response.json()).length).toBeGreaterThanOrEqual(minimumEntries);
      });
      await and('CloudFront may cache it for 5 minutes', () =>
        expect(response.headers()['cache-control']).toBe('max-age=300, public'),
      );
    });
  }

  test('content API serves the home profile', async ({ request }) => {
    await given('the live content API', () => {});
    const response = await when('the profile is requested', () => request.get('/api/content/profile'));
    await then("it returns Shane's profile", async () => {
      expect(response.status()).toBe(200);
      expect((await response.json()).name).toBe('Shane James Sweeney');
    });
  });

  test('the resume page renders content from the live API', async ({ page }) => {
    const response = page.waitForResponse('**/api/content/resume');

    await given('the live site', () => {});
    await when('a visitor opens the resume', () => page.goto('/resume'));
    await then('the page loads its roles from the API', async () => {
      expect((await response).status()).toBe(200);
      await expect(page.getByRole('button', { name: /FIFTH THIRD BANK/ })).toBeVisible();
    });
  });

  test('the resume can be read without JavaScript', async ({ request }) => {
    await given('a resume parser or crawler that does not run JavaScript', () => {});
    const response = await when('it requests /resume', () => request.get('/resume'));
    await then('the HTML holds the resume, with the page as its canonical address', async () => {
      const html = await response.text();
      expect(response.status()).toBe(200);
      expect(html).toContain('<h1>Professional Experience</h1>');
      expect(html).toContain('Fifth Third Bank');
      expect(html).toContain('<link rel="canonical" href="https://selenium-automation.com/resume" />');
    });
  });

  test('unknown API paths return 404 instead of the web page', { tag: '@negative' }, async ({ request }) => {
    await given('the live API', () => {});
    const response = await when('a path that does not exist is requested', () => request.get('/api/does-not-exist'));
    await then('it answers 404 as JSON, not with the web page', () => {
      expect(response.status()).toBe(404);
      expect(response.headers()['content-type']).toContain('application/json');
    });
  });

  // One test, in sequence, to stay well inside the API's 2 requests/second limit.
  test('the API rejects malformed, unsupported and unknown requests', { tag: '@negative' }, async ({ request }) => {
    let response: APIResponse;

    await given('the live API', () => {});

    await when('a contact message that is not valid JSON is posted', async () => {
      response = await request.post('/api/contact', { headers: { 'Content-Type': 'application/json' }, data: '{not json' });
    });
    await then('it is rejected as malformed (400)', async () => {
      expect(response.status()).toBe(400);
      expect((await response.json()).error).toBe('malformed_request');
    });

    await when('a contact message is posted as plain text', async () => {
      response = await request.post('/api/contact', { headers: { 'Content-Type': 'text/plain' }, data: 'name=Jane' });
    });
    await then('it is rejected as an unsupported type (415)', () => expect(response.status()).toBe(415));

    await when('the contact API is called with GET', async () => {
      response = await request.get('/api/contact');
    });
    await then('the method is not allowed (405)', () => expect(response.status()).toBe(405));

    await when('a content page that does not exist is requested', async () => {
      response = await request.get('/api/content/secrets');
    });
    await then('it answers 404 as JSON', () => {
      expect(response.status()).toBe(404);
      expect(response.headers()['content-type']).toContain('application/json');
    });
  });
});
