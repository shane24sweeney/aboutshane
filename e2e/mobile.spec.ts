import type { Locator } from '@playwright/test';
import { expect, test } from './fixtures';
import { pages } from './pages';

// Phone-layout checks: emulated Pixel and iPhone locally and in CI, real devices on BrowserStack.
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
    await page.goto('/home');
    const width = await page.evaluate(() => window.innerWidth);
    test.skip(width > PHONE_MAX_WIDTH, `phone layouts only (viewport is ${width}px)`);
  });

  test('nav fits on one row of icon buttons large enough to tap', async ({ page }) => {
    const links = page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link');
    await expect(links).toHaveCount(pages.length);

    const tops = new Set<number>();
    for (const link of await links.all()) {
      await expectTappable(link);
      await expect(link.locator('.nav-label')).toBeHidden();
      tops.add(Math.round((await link.boundingBox())!.y));
    }
    expect(tops.size, 'nav buttons share one row').toBe(1);
  });

  test('tapping each nav button opens its page', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Primary navigation' });
    for (const { path, nav: label, heading } of pages) {
      await nav.getByRole('link', { name: label, exact: true }).tap();
      await expect(page).toHaveURL(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeAttached();
    }
  });

  for (const { path, heading } of pages) {
    test(`${path} does not scroll sideways`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeAttached();
      await page.waitForLoadState('networkidle');
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    });
  }

  test('home page buttons are large enough to tap', async ({ page }) => {
    for (const name of ['Contact me', 'LinkedIn', 'GitHub']) {
      await expectTappable(page.getByRole('main').getByRole('link', { name, exact: true }));
    }
  });

  test('contact form brings up the right keyboards without zooming', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByLabel('E-mail')).toHaveAttribute('type', 'email');
    await expect(page.getByLabel('E-mail')).toHaveAttribute('autocomplete', 'email');
    await expect(page.getByLabel('Name')).toHaveAttribute('autocomplete', 'name');

    for (const label of ['Name', 'E-mail', 'Message']) {
      const fontSize = await page.getByLabel(label).evaluate((field) => parseFloat(getComputedStyle(field).fontSize));
      expect.soft(fontSize, `${label} font size`).toBeGreaterThanOrEqual(MIN_INPUT_FONT_PX);
    }
    await expectTappable(page.getByRole('button', { name: 'Submit' }));
  });

  test('resume roles expand with a tap and stay on screen', async ({ page }) => {
    await page.goto('/resume');
    const role = page.getByRole('button', { name: /FIFTH THIRD BANK/ });
    await role.tap();
    await expect(role).toHaveAttribute('aria-expanded', 'true');

    const highlights = page.locator('.accordion-collapse.show');
    await expect(highlights).toBeVisible();
    const innerWidth = await page.evaluate(() => window.innerWidth);
    const box = (await highlights.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(innerWidth);
  });
});
