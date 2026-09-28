import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

// Every page carousel, by path and the region label SiteCarousel gives it.
const carousels = [
  { path: '/home', label: 'Career overview' },
  { path: '/about', label: 'About Shane' },
  { path: '/testimonials', label: 'Testimonials' },
  { path: '/education', label: 'Education' },
  { path: '/charity', label: 'Charity work' },
] as const;

async function slideCount(page: Page) {
  const position = await page.locator('.site-carousel-position').textContent();
  return Number(/of (\d+)/.exec(position ?? '')?.[1]);
}

/** Resolves once no slide is mid-transition, so the layout is final. */
async function settled(page: Page) {
  await expect(page.locator('.carousel-item-next, .carousel-item-prev')).toHaveCount(0);
}

async function layout(page: Page, label: string) {
  const box = await page.getByRole('region', { name: label }).boundingBox();
  const { scrollY, pageHeight } = await page.evaluate(() => ({
    scrollY: Math.round(window.scrollY),
    pageHeight: document.documentElement.scrollHeight,
  }));
  return { carouselHeight: Math.round(box!.height), scrollY, pageHeight };
}

test.describe('carousels', () => {
  test.describe('changing slides while scrolled down', () => {
    // Instant transitions and no autoplay, so each step is one deliberate slide change.
    test.use({ reducedMotion: 'reduce' });

    for (const { path, label } of carousels) {
      test(`${path} keeps its height and the scroll position on every slide`, async ({ page }) => {
        test.skip(path === '/home' && page.viewportSize()!.width <= 600, 'Home stacks its sections on phones');
        await page.goto(path);
        const carousel = page.getByRole('region', { name: label });
        await expect(carousel).toBeVisible();
        await page.waitForLoadState('networkidle');
        // Scrolled to the bottom is where a shrinking page would drag the reader upward.
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        const before = await layout(page, label);

        const count = await slideCount(page);
        for (let slide = 2; slide <= count + 1; slide += 1) {
          await page.getByRole('button', { name: 'Next slide' }).click();
          await expect(page.locator('.site-carousel-position')).toHaveText(`${((slide - 1) % count) + 1} of ${count}`);
          await settled(page);
          expect(await layout(page, label), `after moving to slide ${((slide - 1) % count) + 1}`).toEqual(before);
        }
      });
    }
  });

  test('autoplay advances a carousel nobody has touched', async ({ page }) => {
    await page.clock.install();
    await page.goto('/education');
    await expect(page.locator('.site-carousel-position')).toHaveText('1 of 3');
    await page.clock.runFor(4_500);
    await expect(page.locator('.site-carousel-position')).toHaveText('2 of 3');
  });

  test('home shows its sections stacked on phones and as a carousel on wider screens', async ({ page }) => {
    await page.goto('/home');
    const isPhone = page.viewportSize()!.width <= 600;
    await expect(page.getByRole('region', { name: 'Career overview' })).toHaveCount(isPhone ? 0 : 1);
    // Stacked, all three section headings are readable without waiting or tapping.
    const visibleHeadings = page.getByRole('heading', { level: 2 });
    await expect(visibleHeadings).toHaveCount(isPhone ? 3 : 1);
  });

  test('autoplay stops for good once the visitor touches the carousel', async ({ page }) => {
    await page.clock.install();
    await page.goto('/testimonials');
    await page.getByRole('region', { name: 'Testimonials' }).click();
    await page.clock.runFor(30_000);
    await expect(page.locator('.site-carousel-position')).toHaveText(/^1 of /);
    await expect(page.getByRole('button', { name: 'Play slideshow' })).toBeVisible();
  });

  test('the pause button stops autoplay and play resumes it', async ({ page }) => {
    await page.clock.install();
    await page.goto('/education');
    await page.getByRole('button', { name: 'Pause slideshow' }).click();
    await page.clock.runFor(20_000);
    await expect(page.locator('.site-carousel-position')).toHaveText('1 of 3');

    await page.getByRole('button', { name: 'Play slideshow' }).click();
    await page.clock.runFor(4_500);
    await expect(page.locator('.site-carousel-position')).toHaveText('2 of 3');
  });

  test('never autoplays for visitors who prefer reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.install();
    await page.goto('/charity');
    await page.clock.runFor(30_000);
    await expect(page.locator('.site-carousel-position')).toHaveText('1 of 5');
    await expect(page.getByRole('button', { name: 'Play slideshow' })).toBeVisible();
  });

  test('previous wraps from the first slide to the last, and only the current slide is exposed', async ({ page }) => {
    await page.goto('/testimonials');
    const count = await slideCount(page);
    await page.getByRole('button', { name: 'Previous slide' }).click();
    await expect(page.locator('.site-carousel-position')).toHaveText(`${count} of ${count}`);
    await settled(page);
    await expect(page.getByRole('region', { name: 'Testimonials' }).getByRole('heading', { level: 2 })).toHaveCount(1);
  });
});
