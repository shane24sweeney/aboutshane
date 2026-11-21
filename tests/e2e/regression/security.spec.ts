import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { expect, test } from '../support/fixtures';
import { and, given, then, when } from '../support/steps';

// Cross-site scripting (XSS): every place the site shows text it didn't write itself (the content
// API, the contact API's answers, the address bar) is fed script and HTML.
// Each payload would bump window.__xss or open a dialog if it ran; the page must show it as plain
// text instead. All against the local build with the APIs mocked, so nothing reaches production.

const PAYLOADS = [
  '<img src=x onerror="window.__xss=(window.__xss||0)+1">',
  '<script>window.__xss=(window.__xss||0)+1</script>',
  '<svg onload="window.__xss=(window.__xss||0)+1"></svg>',
  '"><iframe src="javascript:window.__xss=(window.__xss||0)+1"></iframe>',
] as const;
const MARK = 'xss-probe';

const content = (name: string) => JSON.parse(readFileSync(new URL(`../../../content/${name}.json`, import.meta.url), 'utf8'));

/** Counts any payload that runs, and fails on any dialog it opens. */
async function watchForScript(page: Page) {
  await page.addInitScript(() => ((window as unknown as { __xss: number }).__xss = 0));
  page.on('dialog', (dialog) => {
    throw new Error(`A dialog opened: ${dialog.message()}`);
  });
}

async function expectNothingRan(page: Page) {
  expect(await page.evaluate(() => (window as unknown as { __xss: number }).__xss), 'payloads that ran').toBe(0);
  await expect(page.locator(`img[src="x"], iframe[src^="javascript:" i], svg[onload], [onerror]`)).toHaveCount(0);
}

test.describe('cross-site scripting', { tag: ['@security', '@negative'] }, () => {
  for (const [index, payload] of PAYLOADS.entries()) {
    test(`home shows content-API text as text, not HTML (payload ${index + 1})`, async ({ page }) => {
      await given('the content API returns a profile with script in it', async () => {
        await watchForScript(page);
        const profile = content('profile');
        await page.route('**/api/content/profile', (route) =>
          route.fulfill({
            json: {
              ...profile,
              headline: `${MARK} ${payload}`,
              summary: [`${MARK} **${payload}** in bold`, ...profile.summary.slice(1)],
              strengths: [`${MARK} ${payload}`, ...profile.strengths.slice(1)],
              highlights: [{ label: `${MARK} ${payload}`, text: payload }, ...profile.highlights.slice(1)],
            },
          }),
        );
      });
      await when('the visitor opens the home page', () => page.goto('/home'));
      await then('the payload is shown literally and never runs', async () => {
        await expect(page.getByText(`${MARK} ${payload}`).first()).toBeVisible();
        await expectNothingRan(page);
      });
    });
  }

  test('testimonials, resume and charity show content-API text as text', async ({ page }) => {
    const payload = PAYLOADS[0];
    await given('the content API puts script in a testimonial, a resume role and a charity', async () => {
      await watchForScript(page);
      const [testimonial, ...testimonials] = content('testimonials');
      const [role, ...resume] = content('resume');
      const [charity, ...charities] = content('charity');
      await page.route('**/api/content/testimonials', (route) =>
        route.fulfill({ json: [{ ...testimonial, name: `${MARK} ${payload}`, recommendation: payload }, ...testimonials] }),
      );
      await page.route('**/api/content/resume', (route) =>
        route.fulfill({ json: [{ ...role, role: `${MARK} ${payload}`, highlights: [payload] }, ...resume] }),
      );
      await page.route('**/api/content/charity', (route) => route.fulfill({ json: [{ ...charity, title: `${MARK} ${payload}` }, ...charities] }));
    });
    for (const path of ['/testimonials', '/resume', '/charity']) {
      await when(`the visitor opens ${path}`, () => page.goto(path));
      await then('the payload is shown literally and never runs', async () => {
        await expect(page.getByText(`${MARK} ${payload}`).first()).toBeAttached();
        await expectNothingRan(page);
      });
    }
  });

  test('the race map escapes race names in its pins and popups', async ({ page }) => {
    const payload = PAYLOADS[0];
    await given('the content API returns races whose names contain script', async () => {
      await watchForScript(page);
      const running = content('running');
      // Pins are placed by known town names, so only the race names (listed in each popup) change.
      const races = running.races.map((race: { event: string }) => ({ ...race, event: `${MARK} ${payload}` }));
      await page.route('**/api/content/running', (route) => route.fulfill({ json: { ...running, races } }));
    });
    await when('the visitor opens the running page and a pin on the map', async () => {
      await page.goto('/running');
      // Helen's pin stands alone even on small phones, so the click can't land on a neighbour.
      await page.locator('.race-pin[data-location="Helen, GA"]').click();
    });
    await then('the popups show the payload as text and it never runs', async () => {
      await expect(page.locator('.leaflet-popup-content').filter({ hasText: payload })).toBeVisible();
      await expectNothingRan(page);
    });
  });

  test('the contact form sends script as plain text and never shows the API’s text', async ({ page }) => {
    const payload = PAYLOADS[1];
    let sent: Record<string, string> | undefined;
    await given('a contact API that rejects the message with script in its error', async () => {
      await watchForScript(page);
      await page.route('**/api/contact', async (route) => {
        sent = route.request().postDataJSON();
        await route.fulfill({ status: 400, json: { error: 'invalid_message', message: `${MARK} ${payload}` } });
      });
    });
    await when('the visitor submits script in every field', async () => {
      await page.goto('/contact');
      await page.locator('[name="name"]').fill(`${MARK} ${payload}`);
      await page.locator('[name="email"]').fill('visitor@example.com');
      await page.locator('[name="message"]').fill(`${payload} ${payload}`);
      await page.getByRole('button', { name: 'Submit' }).click();
    });
    await then('the message reaches the API as JSON text, unchanged', () => {
      expect(sent?.name).toBe(`${MARK} ${payload}`);
      expect(sent?.message).toBe(`${payload} ${payload}`);
    });
    await and('the page shows its own error message, never the API’s text, and nothing runs', async () => {
      await expect(page.getByText('Your message could not be sent. Please try again, or email me directly.')).toBeVisible();
      await expect(page.getByText(MARK)).toHaveCount(0);
      await expectNothingRan(page);
    });
  });

  for (const path of [
    `/home?q=${encodeURIComponent(PAYLOADS[0])}`,
    `/home#${encodeURIComponent(PAYLOADS[1])}`,
    `/resume/${encodeURIComponent(PAYLOADS[0])}`,
  ]) {
    test(`script in the address (${path.slice(0, 24)}…) never runs`, async ({ page }) => {
      await given('a link with script in its address', () => watchForScript(page));
      await when('the visitor opens it', () => page.goto(path));
      await then('the site loads normally and the script never runs', async () => {
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expectNothingRan(page);
      });
    });
  }
});
