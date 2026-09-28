import { expect, test } from '../support/fixtures';
import { pages } from '../support/pages';

test.describe('navigation', () => {
  test('every nav link opens its page and marks it active', async ({ page }) => {
    await page.goto('/home');
    const nav = page.getByRole('navigation', { name: 'Primary navigation' });

    for (const { path, nav: label, heading } of pages) {
      const link = nav.getByRole('link', { name: label, exact: true });
      await link.click();
      await expect(page).toHaveURL(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeAttached();
      await expect(link).toHaveClass(/active/);
    }
  });

  for (const { path, heading } of pages) {
    test(`deep link ${path} loads directly`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeAttached();
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    });
  }

  for (const path of ['/this-page-does-not-exist', '/resume/not-a-page', '/Contact-us', '/%3Cscript%3E']) {
    test(`unknown path ${path} redirects to the home page`, { tag: '@negative' }, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL('/home');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Shane James Sweeney');
    });
  }

  test('pages load without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
    page.on('pageerror', (error) => errors.push(error.message));

    for (const { path } of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
    }
    expect(errors).toEqual([]);
  });
});
