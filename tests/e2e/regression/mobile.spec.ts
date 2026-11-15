import type { Locator } from '@playwright/test';
import { expect, test } from '../support/fixtures';
import { pages } from '../support/pages';
import { and, given, then, when } from '../support/steps';

// Phone-layout checks: emulated phones locally and in CI, and real devices on BrowserStack once in use.
// Each test skips itself on wider screens, so the file is safe on any platform.

/** Matches the phone breakpoint in Navigation.css. */
const PHONE_MAX_WIDTH = 600;
/** WCAG 2.5.5 and Apple's minimum touch target. */
const MIN_TAP_TARGET = 44;
/** iOS zooms the page when a focused field's text is smaller than this. */
const MIN_INPUT_FONT_PX = 16;

async function expectTappable(target: Locator) {
  const box = await target.boundingBox();
  expect(box, 'element is rendered').not.toBeNull();
  expect.soft(box!.height, 'tap target height').toBeGreaterThanOrEqual(MIN_TAP_TARGET);
  expect.soft(box!.width, 'tap target width').toBeGreaterThanOrEqual(MIN_TAP_TARGET);
}

test.describe('phone layout', () => {
  test.beforeEach(async ({ page }) => {
    const width = await given('the visitor is on the home page on a phone', async () => {
      await page.goto('/home');
      return page.evaluate(() => window.innerWidth);
    });
    test.skip(width > PHONE_MAX_WIDTH, `phone layouts only (viewport is ${width}px)`);
  });

  test('nav fits on one row of icon buttons large enough to tap', async ({ page }) => {
    const links = page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link');
    const tops = new Set<number>();

    await when('the visitor looks at the nav', () => {});
    await then('every page has a nav button', () => expect(links).toHaveCount(pages.length));
    await and('each is an icon at least 44px square', async () => {
      for (const link of await links.all()) {
        await expectTappable(link);
        await expect(link.locator('.nav-label')).toBeHidden();
        tops.add(Math.round((await link.boundingBox())!.y));
      }
    });
    await and('they all fit on one row', () => expect(tops.size, 'nav buttons share one row').toBe(1));
  });

  test('tapping each nav button opens its page', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Primary navigation' });
    for (const { path, nav: label, heading } of pages) {
      await when(`the visitor taps ${label}`, () => nav.getByRole('link', { name: label, exact: true }).tap());
      await then(`${path} opens`, async () => {
        await expect(page).toHaveURL(path);
        await expect(page.getByRole('heading', { level: 1, name: heading })).toBeAttached();
      });
    }
  });

  for (const { path, heading } of pages) {
    test(`${path} does not scroll sideways`, async ({ page }) => {
      await when(`the visitor opens ${path}`, async () => {
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1, name: heading })).toBeAttached();
        await page.waitForLoadState('networkidle');
      });
      await then('nothing is wider than the screen', async () => {
        const { scrollWidth, innerWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }));
        expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
      });
    });
  }

  test('home page buttons are large enough to tap', async ({ page }) => {
    await when('the visitor looks at the buttons on the home page', () => {});
    await then('Contact me, LinkedIn and GitHub are each at least 44px square', async () => {
      for (const name of ['Contact me', 'LinkedIn', 'GitHub']) {
        await expectTappable(page.getByRole('main').getByRole('link', { name, exact: true }));
      }
    });
  });

  test('contact form brings up the right keyboards without zooming', async ({ page }) => {
    await when('the visitor opens the contact form', () => page.goto('/contact'));
    await then('E-mail brings up the email keyboard, and Name and E-mail offer autofill', async () => {
      await expect(page.getByLabel('E-mail')).toHaveAttribute('type', 'email');
      await expect(page.getByLabel('E-mail')).toHaveAttribute('autocomplete', 'email');
      await expect(page.getByLabel('Name')).toHaveAttribute('autocomplete', 'name');
    });
    await and('no field is small enough for iOS to zoom in on it', async () => {
      for (const label of ['Name', 'E-mail', 'Message']) {
        const fontSize = await page.getByLabel(label).evaluate((field) => parseFloat(getComputedStyle(field).fontSize));
        expect.soft(fontSize, `${label} font size`).toBeGreaterThanOrEqual(MIN_INPUT_FONT_PX);
      }
    });
    await and('Submit is large enough to tap', () => expectTappable(page.getByRole('button', { name: 'Submit' })));
  });

  test('resume roles expand with a tap and stay on screen', async ({ page }) => {
    const role = page.getByRole('button', { name: /TECH QA MANAGER - AMERITAS/ });
    const highlights = page.locator('.accordion-collapse.show');

    await given('the visitor is on the resume', () => page.goto('/resume'));
    await when('they tap an earlier role', () => role.tap());
    await then('it opens', () => expect(role).toHaveAttribute('aria-expanded', 'true'));
    await and('its highlights fit on the screen', async () => {
      await expect(highlights).toBeVisible();
      const innerWidth = await page.evaluate(() => window.innerWidth);
      const box = (await highlights.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(innerWidth);
    });
  });
});
