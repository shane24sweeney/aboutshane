import type { Page } from '@playwright/test';
import { expect, test } from '../support/fixtures';
import { groupLink, openFromNav, subTab } from '../support/navigate';
import { pages } from '../support/pages';
import { and, given, then, when } from '../support/steps';

// Tabs should open at once. After the first page has loaded, the site prefetches every page's code
// and content (frontend/src/prefetch.ts), so a tap finds everything ready: no spinner, no download.

/**
 * Measured in the page, from the tap to the content showing. Locally a prefetched tab opens in well
 * under 100 ms; CI's Linux WebKit is several times slower than a real phone, so it gets more room.
 */
const TAB_BUDGET_MS = process.env.CI ? 1200 : 600;

/** Flags any loading state the page shows from now on. */
async function watchForLoading(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __loadingShown: boolean };
    w.__loadingShown = false;
    new MutationObserver(() => {
      if (document.querySelector('.page-loading')) w.__loadingShown = true;
    }).observe(document, { childList: true, subtree: true });
  });
}

/** Waits until the idle-time prefetch has fetched every page's content. */
async function prefetched(page: Page) {
  await page.waitForLoadState('networkidle');
  await expect
    .poll(() => page.evaluate(() => performance.getEntriesByType('resource').filter((e) => e.name.includes('/api/content/')).length))
    .toBeGreaterThanOrEqual(7);
  await page.waitForLoadState('networkidle');
}

test.describe('responsiveness', () => {
  test('after the first page, every tab opens with no loading state and nothing to download', async ({ page }) => {
    const downloads: string[] = [];
    let prefetchDone = false;

    await given('the visitor has opened the home page and the site has prefetched the rest', async () => {
      const seen = new Set<string>();
      page.on('request', (r) => {
        const url = r.url();
        if (!url.includes('/api/content/') && !url.endsWith('.js')) return;
        // Anything already fetched once is in the browser's cache (WebKit re-links preloaded files).
        // The 3D pages' code (three.js, 137 kB) loads only once the visitor reaches for Metrics or Visitors, to spare
        // phone data, so it is the one new download allowed here.
        if (prefetchDone && !seen.has(url) && !/\/(three|TestGrid3D|VisitorGlobe3D)-[^/]+\.js$/.test(url)) downloads.push(url);
        seen.add(url);
      });
      await page.goto('/home');
      await prefetched(page);
      prefetchDone = true;
      await page.evaluate(() => ((window as unknown as { __loadingShown: boolean }).__loadingShown = false));
    });
    await watchForLoading(page);

    for (const target of pages.filter((p) => p.path !== '/home')) {
      await when(`they open ${target.tab ?? target.group}`, () => openFromNav(page, target));
      await then(`${target.path} shows its heading`, () => expect(page.getByRole('heading', { level: 1, name: target.heading })).toBeAttached());
    }
    await and('no tab needed a page download or a content request', () => expect(downloads).toEqual([]));
    await and('no loading spinner ever appeared', async () => {
      expect(await page.evaluate(() => (window as unknown as { __loadingShown?: boolean }).__loadingShown ?? false)).toBe(false);
    });
  });

  test(`a prefetched tab shows its content within ${TAB_BUDGET_MS} ms of the tap`, async ({ page }) => {
    await given('the site has prefetched every page', async () => {
      await page.goto('/home');
      await prefetched(page);
    });
    // A route through the tiles and sub-tabs; each marker exists only on the page being opened.
    for (const [nav, ready, link] of [
      ['Experience', '.accordion', () => groupLink(page, 'Experience')],
      ['Education', '.education-card', () => subTab(page, 'Experience', 'Education')],
      ['Testimonials', '.carousel', () => subTab(page, 'Experience', 'Testimonials')],
      ['About', '.about-card', () => groupLink(page, 'About')],
      ['Running', '.running-table', () => subTab(page, 'About', 'Running')],
    ] as const) {
      const elapsed = await when(`they tap ${nav}`, async () => {
        // Time it in the page: from the click event to the first frame showing the content.
        const timing = page.evaluate(
          (selector) =>
            new Promise<number>((resolve) => {
              document.addEventListener(
                'click',
                () => {
                  const started = performance.now();
                  const check = () => (document.querySelector(selector) ? resolve(performance.now() - started) : requestAnimationFrame(check));
                  requestAnimationFrame(check);
                },
                { capture: true, once: true },
              );
            }),
          ready,
        );
        await link().click();
        return Math.round(await timing);
      });
      await then(`${nav} is ready within ${TAB_BUDGET_MS} ms (took ${elapsed} ms)`, () => expect(elapsed).toBeLessThan(TAB_BUDGET_MS));
    }
  });

  test('revisiting a page shows it at once, without asking the API again', async ({ page }) => {
    const requests: string[] = [];
    await given('the visitor has seen the resume and gone back home', async () => {
      await page.goto('/resume');
      await expect(page.locator('.accordion')).toBeVisible();
      await page.getByRole('link', { name: 'Home', exact: true }).click();
      await expect(page.getByRole('heading', { level: 1, name: 'Shane James Sweeney' })).toBeVisible();
      page.on('request', (r) => r.url().includes('/api/content/resume') && requests.push(r.url()));
    });
    await when('they open the resume again', () => page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Experience', exact: true }).click());
    await then('it shows straight away from what was already loaded', async () => {
      await expect(page.locator('.accordion')).toBeVisible();
      await expect(page.locator('.page-loading')).toHaveCount(0);
      expect(requests).toEqual([]);
    });
  });

  test('pointing at a tab starts loading its page before the tap', async ({ page }) => {
    const requested: string[] = [];
    await given('a visitor saving data, so nothing is prefetched in the background', async () => {
      await page.addInitScript(() =>
        Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true, effectiveType: '4g' } }),
      );
      page.on('request', (r) => r.url().includes('/api/content/') && requested.push(new URL(r.url()).pathname));
      await page.goto('/home');
      await page.waitForLoadState('networkidle');
    });
    await then('only the home page’s content has been loaded', () => expect(requested).toEqual(['/api/content/profile']));
    await when('their pointer reaches the About tile, before any click', async () => {
      const tile = groupLink(page, 'About');
      await tile.hover().catch(() => tile.focus());
      await tile.focus();
    });
    await then('About’s content is already on its way', () => expect.poll(() => requested).toContain('/api/content/about'));
  });

  test('a visitor saving data gets no background downloads', { tag: '@negative' }, async ({ page }) => {
    const requested: string[] = [];
    await given('the browser reports that the visitor is saving data', () =>
      page.addInitScript(() => Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true } })),
    );
    await when('they open the home page and leave it idle', async () => {
      page.on('request', (r) => r.url().includes('/api/content/') && requested.push(new URL(r.url()).pathname));
      await page.goto('/home');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2500);
    });
    await then('only the page they opened was loaded', () => expect(requested).toEqual(['/api/content/profile']));
  });
});
