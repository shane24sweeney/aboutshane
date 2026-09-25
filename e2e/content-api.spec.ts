import { expect, test } from './fixtures';
import resume from '../content/resume.json' with { type: 'json' };
import { pages } from './pages';

// Locally the content API is served by the fixture in ./fixtures.ts; tests override it with page.route.

const contentPages = [
  { nav: 'Home', api: 'profile' },
  { nav: 'About', api: 'about' },
  { nav: 'Resume', api: 'resume' },
  { nav: 'Testimonials', api: 'testimonials' },
  { nav: 'Education', api: 'education' },
  { nav: 'Charity Work', api: 'charity' },
] as const;

test.describe('content API', () => {
  test('each navigation button loads its page from the content API', async ({ page }) => {
    await page.goto('/contact');
    const nav = page.getByRole('navigation', { name: 'Primary navigation' });

    for (const { nav: label, api } of contentPages) {
      const request = page.waitForRequest(`**/api/content/${api}`);
      await nav.getByRole('link', { name: label, exact: true }).click();
      expect((await request).method()).toBe('GET');
      const heading = pages.find((entry) => entry.nav === label)?.heading ?? '';
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeAttached();
    }
  });

  test('renders what the API returns', async ({ page }) => {
    const served = [{ ...resume[0], role: 'Role served by the API', highlights: ['Highlight from the API'] }];
    await page.route('**/api/content/resume', (route) => route.fulfill({ json: served }));

    await page.goto('/resume');
    const entry = page.getByRole('button', { name: /ROLE SERVED BY THE API/ });
    await expect(entry).toBeVisible();
    await expect(page.getByRole('button')).toHaveCount(1);
    await entry.click();
    await expect(page.getByText('Highlight from the API')).toBeVisible();
  });

  test('falls back to the bundled content when the API fails', async ({ page }) => {
    await page.route('**/api/content/resume', (route) => route.fulfill({ status: 500, json: { error: 'internal_error' } }));

    await page.goto('/resume');
    await expect(page.getByRole('button', { name: /FIFTH THIRD BANK/ })).toBeVisible();
    await expect(page.getByRole('button')).toHaveCount(resume.length);
  });

  test('shows a loading indicator while a slow response is on its way', async ({ page }) => {
    let release: () => void = () => {};
    const released = new Promise<void>((resolve) => (release = resolve));
    await page.route('**/api/content/resume', async (route) => {
      await released;
      await route.fulfill({ json: resume });
    });

    await page.goto('/resume');
    await expect(page.locator('.page-loading .spinner-border')).toBeVisible();
    release();
    await expect(page.getByRole('button', { name: /FIFTH THIRD BANK/ })).toBeVisible();
    await expect(page.locator('.page-loading')).toHaveCount(0);
  });
});
