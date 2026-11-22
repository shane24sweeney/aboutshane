import type { Locator } from '@playwright/test';
import { expect, test } from '../support/fixtures';
import { openFromNav } from '../support/navigate';
import { groups, pages } from '../support/pages';
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

  test('nav is a bar of five labelled tiles along the bottom, large enough to tap', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Primary navigation' });
    const links = nav.getByRole('link');
    const tops: number[] = [];

    await when('the visitor looks at the nav', () => {});
    await then('there is a tile for each of the five groups', () => expect(links).toHaveCount(groups.length));
    await and('each shows its name under its icon, fully on screen, and is at least 44px square', async () => {
      const innerWidth = await page.evaluate(() => window.innerWidth);
      for (const [index, link] of (await links.all()).entries()) {
        await expectTappable(link);
        const label = link.locator('.nav-label');
        await expect(label).toBeVisible();
        await expect(label).toHaveText(groups[index]!);
        const box = (await label.boundingBox())!;
        expect(box.x, `${groups[index]} label starts on screen`).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width, `${groups[index]} label ends on screen`).toBeLessThanOrEqual(innerWidth);
        tops.push((await link.boundingBox())!.y);
      }
    });
    await and('they sit in one row along the bottom of the screen', async () => {
      const rows = tops.sort((a, b) => a - b).filter((top, i, all) => i === 0 || top - all[i - 1] > 10);
      expect(rows.length, 'nav rows').toBe(1);
      const bar = (await nav.boundingBox())!;
      const height = page.viewportSize()!.height;
      expect(bar.y + bar.height, 'bar reaches the bottom').toBeGreaterThanOrEqual(height - 1);
      expect(bar.y, 'bar sits low on the screen').toBeGreaterThan(height - 140);
    });
  });

  test('the bottom bar stays put while scrolling, and never covers the end of the page', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Primary navigation' });
    await page.goto('/resume');
    await page.waitForLoadState('networkidle');
    const before = (await nav.boundingBox())!;
    await when('the visitor scrolls to the very end of a long page', async () => {
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await expect.poll(() => page.evaluate(() => Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 1)).toBe(true);
    });
    await then('the bar has not moved', async () => expect(Math.round((await nav.boundingBox())!.y)).toBe(Math.round(before.y)));
    await and('the last thing on the page sits above it', async () => {
      const lastText = page.locator('footer .site-footer-group').last();
      const text = (await lastText.boundingBox())!;
      expect(text.y + text.height, 'footer ends above the bar').toBeLessThanOrEqual((await nav.boundingBox())!.y + 1);
    });
  });

  test('tapping each group, then each sub-tab, opens every page', async ({ page }) => {
    for (const target of pages) {
      await when(`the visitor taps ${target.group}${target.tab ? `, then ${target.tab}` : ''}`, () => openFromNav(page, target, 'tap'));
      await then(`${target.path} opens`, async () => {
        await expect(page).toHaveURL(target.path);
        await expect(page.getByRole('heading', { level: 1, name: target.heading })).toBeAttached();
      });
    }
  });

  test('sub-tabs are large enough to tap and fit the screen', async ({ page }) => {
    await given('the visitor is on the About page, which has three sub-tabs', () => page.goto('/about'));
    await then('each sub-tab is at least 44px tall and on screen', async () => {
      const innerWidth = await page.evaluate(() => window.innerWidth);
      for (const tab of await page.getByRole('navigation', { name: 'About pages' }).getByRole('link').all()) {
        const box = (await tab.boundingBox())!;
        expect(box.height).toBeGreaterThanOrEqual(MIN_TAP_TARGET);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(innerWidth);
      }
    });
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
    const role = page.getByRole('button', { name: /Tech QA Manager - Ameritas/i });
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
