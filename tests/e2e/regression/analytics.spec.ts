import { expect, test } from '../support/fixtures';
import sample from '../support/visitors.sample.json' with { type: 'json' };
import { and, given, then, when } from '../support/steps';

// The fixtures serve ./visitors.sample.json for GET /api/visitors.
test.describe('analytics page', () => {
  test('shows visitors, the US and abroad, a 3D globe, and how fast the site is', async ({ page }) => {
    await given('the visitor opens Analytics', () => page.goto('/analytics'));
    await then('the headline numbers are shown', async () => {
      const numbers = page.getByRole('list', { name: 'Visitor numbers' });
      await expect(numbers.getByText(sample.totals.users.toLocaleString('en-US'))).toBeVisible();
      await expect(numbers.getByText('67%')).toBeVisible();
      await expect(numbers.getByText('33%')).toBeVisible();
    });
    await and('the globe is drawn in 3D', () => expect(page.getByTestId('visitor-globe').locator('canvas')).toBeVisible());
    await and('the top countries are listed, the US first', async () => {
      const countries = page.getByRole('list', { name: 'Top countries' }).getByRole('listitem');
      await expect(countries).toHaveCount(Math.min(12, sample.countries.length));
      await expect(countries.first()).toContainText('United States');
    });
    await and('the speed for real visitors, the API and the load test sits beside them', async () => {
      const speed = page.getByRole('region', { name: 'How fast it is' }).or(page.locator('section', { has: page.getByRole('heading', { name: 'How fast it is' }) }));
      await expect(speed.getByRole('heading', { name: 'For real visitors' })).toBeVisible();
      await expect(speed.getByText('1,840 ms')).toBeVisible();
      await expect(speed.getByRole('heading', { name: 'The API' })).toBeVisible();
      await expect(speed.getByText('24 ms').first()).toBeVisible();
      await expect(speed.getByRole('heading', { name: 'Under load (JMeter)' })).toBeVisible();
    });
  });

  test('selecting a country in the list marks it', async ({ page }) => {
    await given('the visitor is on Analytics', () => page.goto('/analytics'));
    const ireland = page.getByRole('list', { name: 'Top countries' }).getByRole('button', { name: /Ireland/ });
    await when('they choose Ireland', () => ireland.click());
    await then('Ireland is marked as selected', () => expect(ireland).toHaveAttribute('aria-pressed', 'true'));
  });

  test('fits every screen without scrolling sideways', async ({ page }) => {
    await given('the visitor opens Analytics', () => page.goto('/analytics'));
    await then('nothing is wider than the screen', async () => {
      await expect(page.getByTestId('visitor-globe').locator('canvas')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
    });
  });

  test('says the numbers are coming before the first export', { tag: '@negative' }, async ({ page }) => {
    await given('no visitor numbers have been exported yet', () =>
      page.route('**/api/visitors', (route) => route.fulfill({ json: { available: false, message: 'Visitor numbers are collected daily; the first figures appear the morning after analytics starts.' } })),
    );
    await when('the visitor opens Analytics', () => page.goto('/analytics'));
    await then('they are told the numbers are on their way', () => expect(page.getByText(/first figures appear the morning after/)).toBeVisible());
  });

  test('says so when the numbers cannot be loaded', { tag: '@negative' }, async ({ page }) => {
    await given('the visitors API is failing', () => page.route('**/api/visitors', (route) => route.fulfill({ status: 500, json: { error: 'internal_error' } })));
    await when('the visitor opens Analytics', () => page.goto('/analytics'));
    await then('they see an error, and the tabs still work', async () => {
      await expect(page.getByRole('alert')).toContainText("couldn't be loaded");
      await page.getByRole('link', { name: 'Home', exact: true }).click();
      await expect(page).toHaveURL('/home');
    });
  });
});

test.describe('analytics and cookie consent', () => {
  test('automated browsers like these tests never load Google Analytics', async ({ page }) => {
    const google: string[] = [];
    await given('every request is watched', () =>
      page.on('request', (r) => /googletagmanager|google-analytics|analytics\.google/.test(r.url()) && google.push(r.url())),
    );
    await when('the visitor opens a few pages and waits', async () => {
      for (const path of ['/home', '/resume', '/analytics']) await page.goto(path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
    });
    await then('no request went to Google', () => expect(google).toEqual([]));
  });

  test.describe('in Europe', () => {
    test.use({ timezoneId: 'Europe/Dublin' });

    test('visitors are asked first, and their choice is remembered', async ({ page }) => {
      const banner = page.getByRole('region', { name: 'Cookie consent' });
      await given('a visitor in Ireland opens the site', () => page.goto('/home'));
      await then('they are asked about analytics cookies, and the page still works', async () => {
        await expect(banner).toBeVisible();
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      });
      await when('they decline', () => banner.getByRole('button', { name: 'Decline' }).click());
      await then('the banner goes and stays gone on the next visit', async () => {
        await expect(banner).toHaveCount(0);
        await page.reload();
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expect(banner).toHaveCount(0);
      });
      await when('they open Cookie settings in the footer', () => page.getByRole('button', { name: 'Cookie settings' }).click());
      await then('they can change their mind', async () => {
        await expect(banner).toContainText('You currently decline them.');
        await banner.getByRole('button', { name: 'Accept analytics' }).click();
        await expect(banner).toHaveCount(0);
      });
    });
  });

  test.describe('in the US', () => {
    test.use({ timezoneId: 'America/New_York' });

    test('visitors are not interrupted, and Cookie settings is always available', async ({ page }) => {
      await given('a visitor in the US opens the site', () => page.goto('/home'));
      await then('no banner appears', async () => {
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expect(page.getByRole('region', { name: 'Cookie consent' })).toHaveCount(0);
      });
      await when('they open Cookie settings', () => page.getByRole('button', { name: 'Cookie settings' }).click());
      await then('they can decline analytics', async () => {
        await page.getByRole('region', { name: 'Cookie consent' }).getByRole('button', { name: 'Decline' }).click();
        expect(await page.evaluate(() => localStorage.getItem('aboutshane.analytics-consent'))).toBe('denied');
      });
    });
  });
});

test.describe('analytics page: cross-site scripting', { tag: ['@security', '@negative'] }, () => {
  test('shows country names and page paths from Google Analytics as text, never as HTML', async ({ page }) => {
    // Anyone can visit /<img src=x onerror=…>, so page paths reaching GA are untrusted.
    const payload = '<img src=x onerror="window.__xss=(window.__xss||0)+1">';
    await given('visitor numbers whose country names and page paths contain script', async () => {
      await page.addInitScript(() => ((window as unknown as { __xss: number }).__xss = 0));
      const hostile = structuredClone(sample);
      hostile.countries[1]!.name = `xss-probe ${payload}`;
      hostile.pages[0]!.path = `/xss-probe${payload}`;
      await page.route('**/api/visitors', (route) => route.fulfill({ json: hostile }));
    });
    await when('the visitor opens Analytics', () => page.goto('/analytics'));
    await then('the payloads are shown literally and never run', async () => {
      await expect(page.getByText(`xss-probe ${payload}`)).toBeVisible();
      await expect(page.getByText(`/xss-probe${payload}`)).toBeVisible();
      expect(await page.evaluate(() => (window as unknown as { __xss: number }).__xss)).toBe(0);
      await expect(page.locator('img[src="x"]')).toHaveCount(0);
    });
  });
});
