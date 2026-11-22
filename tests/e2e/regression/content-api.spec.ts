import type { Page } from '@playwright/test';
import { expect, test } from '../support/fixtures';
import resume from '../../../content/resume.json' with { type: 'json' };
import { openFromNav } from '../support/navigate';
import { pages } from '../support/pages';
import { given, then, when } from '../support/steps';

// Locally the content API is served by the fixture in ../support/fixtures.ts; tests override it with page.route.

/** The content API behind each page that has one. */
const contentApi: Record<string, string> = {
  '/home': 'profile',
  '/about': 'about',
  '/resume': 'resume',
  '/testimonials': 'testimonials',
  '/education': 'education',
  '/charity': 'charity',
  '/running': 'running',
};
const contentPages = pages.filter((p) => p.path in contentApi);

async function expectBundledResume(page: Page) {
  await expect(page.getByRole('button', { name: /Fifth Third Bank/i })).toBeVisible();
  await expect(page.locator('.accordion').getByRole('button')).toHaveCount(resume.length);
}

test.describe('content API', () => {
  test('each page opened from the navigation shows content from the API, asked once per visit', async ({ page }) => {
    const requested: string[] = [];

    await given('the visitor is on the contact page, which loads no content', async () => {
      page.on('request', (r) => r.url().includes('/api/content/') && requested.push(`${r.method()} ${new URL(r.url()).pathname}`));
      await page.goto('/contact');
    });

    // Pages are prefetched in the background (frontend/src/prefetch.ts), so the request may come
    // before the click; either way each page's content comes from the API, and only once.
    for (const target of contentPages) {
      const api = contentApi[target.path]!;
      await when(`they open ${target.tab ?? target.group}`, () => openFromNav(page, target));
      await then(`the page shows content from GET /api/content/${api}`, async () => {
        await expect(page.getByRole('heading', { level: 1, name: target.heading })).toBeAttached();
        expect(requested.filter((r) => r === `GET /api/content/${api}`)).toHaveLength(1);
      });
    }
  });

  test('renders what the API returns', async ({ page }) => {
    const entry = page.getByRole('button', { name: /Role served by the API/i });

    await given('the content API returns one resume role', async () => {
      const served = [{ ...resume[0], role: 'Role served by the API', highlights: ['Highlight from the API'] }];
      await page.route('**/api/content/resume', (route) => route.fulfill({ json: served }));
    });
    await when('the visitor opens the resume', () => page.goto('/resume'));
    await then('only that role is shown', async () => {
      await expect(entry).toBeVisible();
      await expect(page.locator('.accordion').getByRole('button')).toHaveCount(1);
    });
    await when('they open it', () => entry.click());
    await then('its highlights come from the API', () => expect(page.getByText('Highlight from the API')).toBeVisible());
  });

  test('falls back to the bundled content when the API fails', { tag: '@negative' }, async ({ page }) => {
    await given('the content API fails with a 500', () =>
      page.route('**/api/content/resume', (route) => route.fulfill({ status: 500, json: { error: 'internal_error' } })),
    );
    await when('the visitor opens the resume', () => page.goto('/resume'));
    await then('the bundled resume is shown instead', () => expectBundledResume(page));
  });

  for (const [problem, answer] of [
    ['the page is not found', { status: 404, json: { error: 'request_rejected' } }],
    ['the response is not JSON', { status: 200, contentType: 'text/html', body: '<html>Bad gateway</html>' }],
    ['the response has the wrong shape', { status: 200, json: { unexpected: true } }],
  ] as const) {
    test(`falls back to the bundled content when ${problem}`, { tag: '@negative' }, async ({ page }) => {
      await given(`the content API answers but ${problem}`, () =>
        page.route('**/api/content/resume', (route) => route.fulfill(answer)),
      );
      await when('the visitor opens the resume', () => page.goto('/resume'));
      await then('the bundled resume is shown instead', () => expectBundledResume(page));
    });
  }

  test('falls back to the bundled content when the network drops the request', { tag: '@negative' }, async ({ page }) => {
    await given('the connection to the content API is reset', () =>
      page.route('**/api/content/resume', (route) => route.abort('connectionreset')),
    );
    await when('the visitor opens the resume', () => page.goto('/resume'));
    await then('every bundled role is shown', () => expect(page.locator('.accordion').getByRole('button')).toHaveCount(resume.length));
  });

  test('shows a loading indicator while a slow response is on its way', async ({ page }) => {
    let release: () => void = () => {};
    const released = new Promise<void>((resolve) => (release = resolve));

    await given('the content API is slow to answer', () =>
      page.route('**/api/content/resume', async (route) => {
        await released;
        await route.fulfill({ json: resume });
      }),
    );
    await when('the visitor opens the resume', () => page.goto('/resume'));
    await then('a loading indicator is shown', () => expect(page.locator('.page-loading .spinner-border')).toBeVisible());
    await when('the response arrives', () => release());
    await then('the resume replaces the loading indicator', async () => {
      await expect(page.getByRole('button', { name: /Fifth Third Bank/i })).toBeVisible();
      await expect(page.locator('.page-loading')).toHaveCount(0);
    });
  });
});
