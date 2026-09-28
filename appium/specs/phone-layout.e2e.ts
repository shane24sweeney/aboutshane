import { $, $$, browser, expect } from '@wdio/globals';

// A few of the checks from e2e/mobile.spec.ts, in the phone's real browser through Appium.
// Read-only: the contact form is never submitted.

/** WCAG 2.5.5 and Apple's minimum touch target. */
const MIN_TAP_TARGET = 44;
/** iOS zooms the page when a focused field's text is smaller than this. */
const MIN_INPUT_FONT_PX = 16;
const NAV_BUTTONS = 'nav[aria-label="Primary navigation"] .nav-button';
const PATHS = ['/home', '/contact', '/about', '/resume', '/testimonials', '/education', '/charity'];

describe('phone layout in the real mobile browser', () => {
  it('nav fits on one row of buttons large enough to tap', async () => {
    await browser.url('/home');
    const links = await $$(NAV_BUTTONS);
    expect(links.length).toBe(PATHS.length);

    const tops = new Set<number>();
    for (const link of links) {
      const { width, height } = await link.getSize();
      expect(width).toBeGreaterThanOrEqual(MIN_TAP_TARGET);
      expect(height).toBeGreaterThanOrEqual(MIN_TAP_TARGET);
      tops.add(Math.round((await link.getLocation()).y));
    }
    expect(tops.size).toBe(1);
  });

  for (const path of PATHS) {
    it(`${path} does not scroll sideways`, async () => {
      await browser.url(path);
      await expect($('h1')).toBeDisplayed();
      const overflow = await browser.execute(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  it('contact fields bring up the right keyboard without zooming', async () => {
    await browser.url('/contact');
    await expect($('#contact-email')).toHaveAttribute('type', 'email');

    for (const id of ['contact-name', 'contact-email', 'contact-message']) {
      const fontSize = await $(`#${id}`).getCSSProperty('font-size');
      expect(Number(fontSize.parsed.value)).toBeGreaterThanOrEqual(MIN_INPUT_FONT_PX);
    }
  });
});
