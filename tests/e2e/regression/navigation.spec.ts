import { expect, test } from '../support/fixtures';
import { pages } from '../support/pages';
import { given, then, when } from '../support/steps';

test.describe('navigation', () => {
  test('every nav link opens its page and marks it active', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Primary navigation' });

    await given('the visitor is on the home page', () => page.goto('/home'));

    for (const { path, nav: label, heading } of pages) {
      const link = nav.getByRole('link', { name: label, exact: true });
      await when(`they click ${label} in the nav`, () => link.click());
      await then(`${path} opens with its heading and ${label} marked active`, async () => {
        await expect(page).toHaveURL(path);
        await expect(page.getByRole('heading', { level: 1, name: heading })).toBeAttached();
        await expect(link).toHaveClass(/active/);
      });
    }
  });

  for (const { path, heading } of pages) {
    test(`deep link ${path} loads directly`, async ({ page }) => {
      await given('a visitor has a link to the page', () => {});
      await when(`they open ${path} directly`, () => page.goto(path));
      await then('the page shows its one heading', async () => {
        await expect(page.getByRole('heading', { level: 1, name: heading })).toBeAttached();
        await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      });
    });
  }

  for (const path of ['/this-page-does-not-exist', '/resume/not-a-page', '/Contact-us', '/%3Cscript%3E']) {
    test(`unknown path ${path} redirects to the home page`, { tag: '@negative' }, async ({ page }) => {
      await given('a visitor has a link to a page that does not exist', () => {});
      await when(`they open ${path}`, () => page.goto(path));
      await then('they land on the home page', async () => {
        await expect(page).toHaveURL('/home');
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('Shane James Sweeney');
      });
    });
  }

  test('pages load without console errors', async ({ page }) => {
    const errors: string[] = [];

    await given('console errors and page errors are being recorded', () => {
      page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
      page.on('pageerror', (error) => errors.push(error.message));
    });
    await when('the visitor opens every page', async () => {
      for (const { path } of pages) {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
      }
    });
    await then('no errors were logged', () => expect(errors).toEqual([]));
  });
});
