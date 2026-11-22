import { expect, test } from '../support/fixtures';
import { and, given, then, when } from '../support/steps';

// Site search, the résumé download and the status badge, against the local build. The fixtures
// stand in for GET /api/search, /api/resume.pdf and /api/status (see support/search.ts).

test.describe('site search', () => {
  const box = (page: import('@playwright/test').Page) => page.getByRole('combobox', { name: 'Search the site' });
  const results = (page: import('@playwright/test').Page) => page.getByRole('listbox', { name: 'Search results' }).getByRole('option');

  test('finds matches across pages and opens the chosen one', async ({ page }) => {
    await given('the visitor is on the contact page', () => page.goto('/contact'));
    await when('they search for "appium"', () => box(page).fill('appium'));
    await then('matches from the home page and the résumé are listed with the word marked', async () => {
      await expect(results(page).first()).toBeVisible();
      await expect(results(page).filter({ hasText: 'Resume' }).first()).toBeVisible();
      await expect(results(page).first().locator('mark').first()).toHaveText(/appium/i);
    });
    await when('they choose a résumé match', () => results(page).filter({ hasText: 'Resume' }).first().click());
    await then('the résumé opens and the list closes', async () => {
      await expect(page).toHaveURL('/resume');
      await expect(page.getByRole('listbox')).toHaveCount(0);
      await expect(box(page)).toHaveValue('');
    });
  });

  test('works from the keyboard: "/" to search, arrows to choose, Enter to open', async ({ page }) => {
    await given('the visitor is on the home page', () => page.goto('/home'));
    await when('they press "/" and type a town they raced in', async () => {
      await page.locator('body').press('/');
      await expect(box(page)).toBeFocused();
      await page.keyboard.type('Helen');
      await expect(results(page).first()).toBeVisible();
    });
    await and('press the down arrow and Enter', async () => {
      await page.keyboard.press('ArrowDown');
      await expect(results(page).first()).toHaveAttribute('aria-selected', 'true');
      await page.keyboard.press('Enter');
    });
    await then('the running page opens', () => expect(page).toHaveURL('/running'));
  });

  test('says when nothing matches', { tag: '@negative' }, async ({ page }) => {
    await given('the visitor is on the home page', () => page.goto('/home'));
    await when('they search for something not on the site', () => box(page).fill('zzqx nothing'));
    await then('they are told there are no matches', () => expect(page.getByText('No matches for “zzqx nothing”')).toBeVisible());
  });

  test('says so when search is down, and the page keeps working', { tag: '@negative' }, async ({ page }) => {
    await given('the search API is failing', () => page.route('**/api/search?**', (route) => route.fulfill({ status: 500, json: { error: 'internal_error' } })));
    await when('the visitor searches', async () => {
      await page.goto('/home');
      await box(page).fill('appium');
    });
    await then('they see that search is unavailable', () => expect(page.getByText('Search is unavailable right now. Please try again.')).toBeVisible());
    await and('the tabs still work', async () => {
      await page.keyboard.press('Escape');
      await page.getByRole('link', { name: 'Resume', exact: true }).click();
      await expect(page).toHaveURL('/resume');
    });
  });

  test('closes when the visitor presses Escape or taps elsewhere', async ({ page }) => {
    await given('search results are showing', async () => {
      await page.goto('/home');
      await box(page).fill('appium');
      await expect(results(page).first()).toBeVisible();
    });
    await when('they press Escape', () => box(page).press('Escape'));
    await then('the list closes', () => expect(page.getByRole('listbox')).toHaveCount(0));
    await when('they type again and then tap the page', async () => {
      await box(page).fill('playwright');
      await expect(results(page).first()).toBeVisible();
      await page.locator('footer').click();
    });
    await then('the list closes again', () => expect(page.getByRole('listbox')).toHaveCount(0));
  });

  test('fits the screen on every device without covering the tabs', async ({ page }) => {
    await given('the visitor opens the site', () => page.goto('/home'));
    await then('the search box is on screen, under the tabs, and nothing scrolls sideways', async () => {
      const nav = (await page.getByRole('navigation', { name: 'Primary navigation' }).boundingBox())!;
      const search = (await box(page).boundingBox())!;
      const width = page.viewportSize()!.width;
      expect(search.y).toBeGreaterThanOrEqual(nav.y + nav.height - 1);
      expect(search.x).toBeGreaterThanOrEqual(0);
      expect(search.x + search.width).toBeLessThanOrEqual(width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    });
  });
});

test.describe('résumé download', () => {
  test('downloads the résumé as a PDF', async ({ page }) => {
    await given('the visitor is on the résumé', () => page.goto('/resume'));
    const download = await when('they press Download résumé (PDF)', async () => {
      const waiting = page.waitForEvent('download');
      await page.getByRole('link', { name: 'Download résumé (PDF)' }).click();
      return waiting;
    });
    await then('a file named for Shane starts downloading from the API', () => {
      // The PDF itself is checked by the API's JUnit tests and the live smoke tests.
      expect(download.suggestedFilename()).toBe('Shane-James-Sweeney-Resume.pdf');
      expect(new URL(download.url()).pathname).toBe('/api/resume.pdf');
    });
  });
});

test.describe('status badge', () => {
  test('shows the API is up and the latest test verdict, linking to Metrics', async ({ page }) => {
    await given('the visitor is on the home page', () => page.goto('/home'));
    const badge = page.getByRole('link', { name: 'All systems normal · Daily tests: Healthy' });
    await then('the footer shows the status badge', () => expect(badge).toBeVisible());
    await when('they click it', () => badge.click());
    await then('Metrics opens', () => expect(page).toHaveURL('/metrics'));
  });

  test('is left out when the API is down', { tag: '@negative' }, async ({ page }) => {
    await given('the status API is failing', () => page.route('**/api/status', (route) => route.fulfill({ status: 503 })));
    await when('the visitor opens the site and waits', async () => {
      await page.goto('/home');
      await page.waitForTimeout(1800);
    });
    await then('there is no badge, and nothing else breaks', async () => {
      await expect(page.getByRole('link', { name: /All systems normal/ })).toHaveCount(0);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  });
});
