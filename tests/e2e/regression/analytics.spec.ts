import { expect, test } from '../support/fixtures';
import sample from '../support/visitors.sample.json' with { type: 'json' };
import { hoverABar } from '../support/canvas';
import { and, given, then, when } from '../support/steps';
import { expect3D } from '../support/webgl';

/** The globe's bar colours: the US, and abroad. */
const GLOBE_BARS = ['#f5c86b', '#79d2c0'];
/** The molecule's atom colours: pages, countries, speed. */
const MOLECULE_ATOMS = ['#b48cff', '#ff7eb6', '#6fa8ff'];

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
    await and('the globe is drawn in 3D', () => expect3D(page, page.getByTestId('visitor-globe')));
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

  test('hovering a bar on the globe names the country; selecting it marks it in the list', async ({ page, isMobile }) => {
    test.skip(isMobile, 'touch screens have no hover');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const globe = page.getByTestId('visitor-globe');
    const tip = globe.locator('.visitor-globe-tip');
    let bar: { x: number; y: number } | null = null;

    await given('the visitor opens Analytics', async () => {
      await page.goto('/analytics');
      test.skip(!(await expect3D(page, globe)), 'no WebGL in this browser, so nothing to hover');
    });
    await when('they rest the pointer on a bar', async () => {
      bar = await hoverABar(page, globe, tip, GLOBE_BARS);
    });
    await then('a tooltip names the country and its visitors', async () => {
      expect(bar, 'no bar found under the pointer').not.toBeNull();
      await expect(tip).toContainText(/\d+ visitors$/);
    });
    const country = (await tip.locator('strong').textContent()) ?? '';
    await when(`they select that bar (${country})`, () => page.mouse.click(bar!.x, bar!.y));
    await then('the same country is marked in the list', () =>
      expect(page.getByRole('list', { name: 'Top countries' }).getByRole('button', { name: new RegExp(country) })).toHaveAttribute('aria-pressed', 'true'),
    );
    await when('they drag the globe round', async () => {
      await page.mouse.move(bar!.x, bar!.y);
      await page.mouse.down();
      await page.mouse.move(bar!.x + 80, bar!.y, { steps: 5 });
    });
    await then('the tooltip goes while dragging', () => expect(tip).toBeHidden());
    await when('they move the pointer off the globe', async () => {
      await page.mouse.up();
      await page.mouse.move(1, 1);
    });
    await then('no tooltip is left behind', () => expect(tip).toBeHidden());
  });

  test('a single visitor reads "1 visitor", and a country with no place on the map is only listed', async ({ page, isMobile }) => {
    test.skip(isMobile, 'touch screens have no hover');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const countries = [...sample.countries.slice(0, 11).map((c) => ({ ...c, users: 1, sessions: 1 })), { code: 'ZZ', name: 'Unknown region', users: 1, sessions: 1 }];
    const globe = page.getByTestId('visitor-globe');
    const tip = globe.locator('.visitor-globe-tip');

    await given('the export has single visitors, one from a region the globe has no place for', () =>
      page.route('**/api/visitors', (route) => route.fulfill({ json: { ...sample, usShare: 0.08, countries } })),
    );
    await when('the visitor opens Analytics and rests the pointer on a bar', async () => {
      await page.goto('/analytics');
      test.skip(!(await expect3D(page, globe)), 'no WebGL in this browser, so nothing to hover');
      expect(await hoverABar(page, globe, tip, GLOBE_BARS), 'no bar found under the pointer').not.toBeNull();
    });
    await then('the tooltip says "1 visitor", not "1 visitors"', () => expect(tip).toContainText(/1 visitor$/));
    await and('the region with no place on the globe is still listed', () =>
      expect(page.getByRole('list', { name: 'Top countries' }).getByRole('button', { name: /Unknown region/ })).toBeVisible(),
    );
  });

  test('shows the site as a rotating 3D molecule of pages, countries and speed', async ({ page }) => {
    // Two full canvas screenshots take about 10 s each on a big tablet screen with CI's software WebGL.
    test.slow();
    const molecule = page.getByTestId('visitor-molecule');
    await given('the visitor opens Analytics', () => page.goto('/analytics'));
    await then('the molecule describes what it shows', () =>
      expect(page.getByRole('img', { name: /^The site as a molecule: 7 pages, 12 countries and 7 speed measures/ })).toBeVisible(),
    );
    const drawn = await expect3D(page, molecule);
    test.skip(!drawn, 'no WebGL in this browser: the fallback was checked');
    await and('its three clusters are named', async () => {
      for (const cluster of ['Pages', 'Countries', 'Speed']) await expect(molecule.locator('.molecule3d-label', { hasText: cluster })).toBeVisible();
    });
    await and('it turns on its own', async () => {
      await molecule.scrollIntoViewIfNeeded();
      const before = await molecule.locator('canvas').screenshot();
      await page.waitForTimeout(1200);
      expect((await molecule.locator('canvas').screenshot()).equals(before)).toBe(false);
    });
  });

  test('holds the molecule still for visitors who ask for reduced motion', async ({ page }) => {
    // Two full canvas screenshots take about 10 s each on a big tablet screen with CI's software WebGL.
    test.slow();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const molecule = page.getByTestId('visitor-molecule');
    await given('the visitor prefers reduced motion and opens Analytics', () => page.goto('/analytics'));
    test.skip(!(await expect3D(page, molecule)), 'no WebGL in this browser');
    await then('the molecule stays where it is', async () => {
      await molecule.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      const before = await molecule.locator('canvas').screenshot();
      await page.waitForTimeout(1200);
      expect((await molecule.locator('canvas').screenshot()).equals(before)).toBe(true);
    });
  });

  test('hovering an atom shows what it stands for and its numbers', async ({ page, isMobile }) => {
    test.skip(isMobile, 'touch screens have no hover');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const molecule = page.getByTestId('visitor-molecule');
    const tip = molecule.locator('.molecule3d-tip');
    let atom: { x: number; y: number } | null = null;

    await given('the visitor opens Analytics', () => page.goto('/analytics'));
    test.skip(!(await expect3D(page, molecule)), 'no WebGL in this browser, so nothing to hover');
    await when('they rest the pointer on an atom', async () => {
      atom = await hoverABar(page, molecule, tip, MOLECULE_ATOMS);
    });
    await then('a tooltip names it and gives its numbers', async () => {
      expect(atom, 'no atom found under the pointer').not.toBeNull();
      await expect(tip.locator('strong')).not.toBeEmpty();
      await expect(tip).toContainText(/\d/);
    });
    await when('they move the pointer off the molecule', () => page.mouse.move(1, 1));
    await then('no tooltip is left behind', () => expect(tip).toBeHidden());
  });

  test('shows how people arrive, their devices, and when they visit', async ({ page }) => {
    await given('the visitor opens Analytics', () => page.goto('/analytics'));
    await then('it lists where visits come from, most first', () =>
      expect(page.getByRole('list', { name: 'Visits by source' }).getByRole('listitem').first()).toContainText('Direct'),
    );
    await and('how engaged visitors are', () => expect(page.getByText('Visits with real engagement')).toBeVisible());
    await and('their devices, browsers and systems', async () => {
      await expect(page.getByRole('list', { name: 'Visitors by device' })).toContainText('Phone');
      await expect(page.getByRole('list', { name: 'Visitors by browser' })).toContainText('Safari');
      await expect(page.getByRole('list', { name: 'Visitors by operating system' })).toContainText('Windows');
    });
    await and('when they visit, by day and by hour', async () => {
      await expect(page.getByRole('list', { name: 'Visits by day of the week' }).getByRole('listitem')).toHaveCount(7);
      await expect(page.getByRole('list', { name: 'Visits by hour of the day' }).getByRole('listitem')).toHaveCount(24);
    });
  });

  test('fits every screen without scrolling sideways', async ({ page }) => {
    await given('the visitor opens Analytics', () => page.goto('/analytics'));
    await then('nothing is wider than the screen', async () => {
      await expect3D(page, page.getByTestId('visitor-globe'));
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
