import { type Response, expect, test } from '@playwright/test';
import { pages } from '../support/pages';
import { and, given, then, when } from '../support/steps';

// Playwright twin of tests/jmeter/button-clicks.jmx: clicks every button that talks to the server on the
// live site and checks the request behind it. Read-only: the contact form is submitted empty, which
// the browser blocks before anything is sent.

/** The content API each nav button's page loads. Contact has none. */
const contentApi: Record<string, string> = {
  '/home': 'profile',
  '/about': 'about',
  '/resume': 'resume',
  '/testimonials': 'testimonials',
  '/education': 'education',
  '/charity': 'charity',
};

/** Same budget as the Postman health check. */
const RESPONSE_BUDGET_MS = 3000;

test.describe('production buttons', () => {
  for (const { path, nav: label, heading } of pages.filter(({ path }) => path in contentApi)) {
    test(`clicking ${label} loads /api/content/${contentApi[path]}`, async ({ page }) => {
      let content: Response | null = null;

      // Start on Contact, which loads no content, so the click triggers a fresh request.
      await given('the visitor is on the contact page, which loads no content', () => page.goto('/contact'));
      await when(`they click ${label} in the nav`, async () => {
        const response = page.waitForResponse(`**/api/content/${contentApi[path]}`, { timeout: 10_000 }).catch(() => null);
        await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: label, exact: true }).click();
        content = await response;
      });
      await then(`/api/content/${contentApi[path]} answers with JSON within ${RESPONSE_BUDGET_MS}ms`, () => {
        expect(content, `clicking ${label} never requested /api/content/${contentApi[path]}`).not.toBeNull();
        if (!content) return;
        expect(content.status()).toBe(200);
        expect(content.headers()['content-type']).toContain('application/json');
        const { responseEnd } = content.request().timing();
        expect.soft(responseEnd, 'response time (ms)').toBeLessThan(RESPONSE_BUDGET_MS);
      });
      await and(`${path} opens`, async () => {
        await expect(page).toHaveURL(path);
        await expect(page.getByRole('heading', { level: 1, name: heading })).toBeAttached();
      });
    });
  }

  test('Submit on an empty contact form is blocked before anything is sent', { tag: '@negative' }, async ({ page }) => {
    const posts: string[] = [];

    await given('the visitor is on the contact page, with every POST being recorded', async () => {
      page.on('request', (request) => request.method() === 'POST' && posts.push(request.url()));
      await page.goto('/contact');
    });
    await when('they press Submit on the empty form', () => page.getByRole('button', { name: 'Submit' }).click());
    await then('the browser flags the missing name', async () => {
      expect(await page.getByLabel('Name').evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true);
    });
    await and('nothing was sent', () => expect(posts).toEqual([]));
  });
});
