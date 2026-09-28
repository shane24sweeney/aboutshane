import { expect, test } from '@playwright/test';
import { pages } from './pages';

// Read-only checks against the live site. Nothing here submits the contact form.

test.describe('production smoke', () => {
  for (const { path, heading } of pages) {
    test(`${path} is up`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeAttached();
    });
  }

  test('serves HTTPS with security headers', async ({ request }) => {
    const response = await request.get('/home');
    const headers = response.headers();
    expect(headers['strict-transport-security']).toContain('max-age=');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  test('contact API is healthy', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  test('contact API validates input without sending anything', async ({ request }) => {
    const response = await request.post('/api/contact', {
      data: { name: '', email: 'not-an-email', message: '', website: '' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('validation_failed');
    expect(Object.keys(body.fields).sort()).toEqual(['email', 'message', 'name']);
  });

  for (const [api, minimumEntries] of [['resume', 14], ['testimonials', 11], ['education', 3], ['charity', 5]] as const) {
    test(`content API serves ${api} with edge caching`, async ({ request }) => {
      const response = await request.get(`/api/content/${api}`);
      expect(response.status()).toBe(200);
      expect(response.headers()['cache-control']).toBe('max-age=300, public');
      expect((await response.json()).length).toBeGreaterThanOrEqual(minimumEntries);
    });
  }

  test('content API serves the home profile', async ({ request }) => {
    const response = await request.get('/api/content/profile');
    expect(response.status()).toBe(200);
    expect((await response.json()).name).toBe('Shane James Sweeney');
  });

  test('the resume page renders content from the live API', async ({ page }) => {
    const response = page.waitForResponse('**/api/content/resume');
    await page.goto('/resume');
    expect((await response).status()).toBe(200);
    await expect(page.getByRole('button', { name: /FIFTH THIRD BANK/ })).toBeVisible();
  });

  test('unknown API paths return 404 instead of the web page', async ({ request }) => {
    const response = await request.get('/api/does-not-exist');
    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toContain('application/json');
  });
});
