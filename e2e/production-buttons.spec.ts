import { expect, test } from '@playwright/test';
import { pages } from './pages';

// Playwright twin of jmeter/button-clicks.jmx: clicks every button that talks to the server on the
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
      // Start on Contact, which loads no content, so the click triggers a fresh request.
      await page.goto('/contact');
      const response = page.waitForResponse(`**/api/content/${contentApi[path]}`, { timeout: 10_000 }).catch(() => null);
      await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: label, exact: true }).click();

      const content = await response;
      expect(content, `clicking ${label} never requested /api/content/${contentApi[path]}`).not.toBeNull();
      if (!content) return;
      expect(content.status()).toBe(200);
      expect(content.headers()['content-type']).toContain('application/json');
      const { responseEnd } = content.request().timing();
      expect.soft(responseEnd, 'response time (ms)').toBeLessThan(RESPONSE_BUDGET_MS);

      await expect(page).toHaveURL(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeAttached();
    });
  }

  test('Submit on an empty contact form is blocked before anything is sent', async ({ page }) => {
    const posts: string[] = [];
    page.on('request', (request) => request.method() === 'POST' && posts.push(request.url()));

    await page.goto('/contact');
    await page.getByRole('button', { name: 'Submit' }).click();

    expect(await page.getByLabel('Name').evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true);
    expect(posts).toEqual([]);
  });
});
