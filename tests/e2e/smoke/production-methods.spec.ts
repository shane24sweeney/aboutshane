import { type APIResponse, expect, test } from '@playwright/test';
import { given, then, when } from '../support/steps';

// The site is read-only apart from the contact form, so nothing on it may be created, replaced or
// deleted over HTTP. A write is refused either at the CloudFront edge (403: the cached paths only
// forward GET and HEAD) or by the API itself (405). Every request here is refused, so nothing changes.

test.describe.configure({ mode: 'default' });

const READ_ONLY = [
  '/api/health',
  '/api/content/profile',
  '/api/content/about',
  '/api/content/resume',
  '/api/content/testimonials',
  '/api/content/education',
  '/api/content/charity',
  '/api/content/running',
  '/api/content/running/stats',
  '/api/search?q=java',
  '/api/resume.pdf',
  '/api/status',
  '/api/visitors',
];
const PAGES = ['/', '/home', '/resume', '/metrics', '/contact'];
const WRITES = ['PUT', 'PATCH', 'DELETE'] as const;

const refused = [403, 405];
const body = { data: { name: 'Method check', email: 'check@example.com', message: 'Overwrite', website: '' } };

test.describe('production: HTTP methods', () => {
  test('no API endpoint can be replaced, patched or deleted', { tag: ['@negative', '@security'] }, async ({ request }) => {
    await given('the live API', () => {});
    for (const path of [...READ_ONLY, '/api/contact']) {
      for (const method of WRITES) {
        const response = await when(`${method} ${path}`, () => send(() => request.fetch(path, { method, ...body })));
        await then('it is refused without giving anything away', async () => {
          expect(refused, `${method} ${path} answered ${response.status()}`).toContain(response.status());
          const text = await response.text();
          expect(text, `${method} ${path}`).not.toMatch(/Exception|springframework|at com\.aboutshane/);
        });
      }
    }
  });

  test('the read-only endpoints cannot be posted to', { tag: ['@negative', '@security'] }, async ({ request }) => {
    await given('the live API', () => {});
    for (const path of READ_ONLY) {
      const response = await when(`POST ${path}`, () => send(() => request.post(path, body)));
      await then('it is refused', () => expect(refused, `POST ${path} answered ${response.status()}`).toContain(response.status()));
    }
  });

  test('the pages themselves cannot be overwritten or deleted', { tag: ['@negative', '@security'] }, async ({ request }) => {
    await given('the live site', () => {});
    for (const path of PAGES) {
      for (const method of ['POST', ...WRITES]) {
        const response = await when(`${method} ${path}`, () => send(() => request.fetch(path, { method, ...body })));
        await then('CloudFront refuses it at the edge', () => expect(response.status(), `${method} ${path}`).toBe(403));
      }
    }
  });
});

/** The API allows 2 requests a second; wait out a 429 rather than fail on it. */
async function send(request: () => Promise<APIResponse>): Promise<APIResponse> {
  for (let attempt = 1; ; attempt++) {
    const response = await request();
    if (response.status() !== 429 || attempt === 4) return response;
    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
  }
}
