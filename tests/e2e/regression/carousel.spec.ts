import type { Page } from '@playwright/test';
import { expect, test } from '../support/fixtures';
import { and, given, then, when } from '../support/steps';

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
        const carousel = page.getByRole('region', { name: label });

        const before = await given(`the visitor has scrolled to the bottom of ${path}`, async () => {
          await page.goto(path);
          await expect(carousel).toBeVisible();
          await page.waitForLoadState('networkidle');
          // Scrolled to the bottom is where a shrinking page would drag the reader upward.
          await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
          return layout(page, label);
        });

        const count = await slideCount(page);
        for (let slide = 2; slide <= count + 1; slide += 1) {
          const shown = ((slide - 1) % count) + 1;
          await when(`they move to slide ${shown} of ${count}`, async () => {
            await page.getByRole('button', { name: 'Next slide' }).click();
            await expect(page.locator('.site-carousel-position')).toHaveText(`${shown} of ${count}`);
            await settled(page);
          });
          await then('the carousel height and scroll position have not moved', async () => {
            expect(await layout(page, label), `after moving to slide ${shown}`).toEqual(before);
          });
        }
      });
    }
  });

  test('autoplay advances a carousel nobody has touched', async ({ page }) => {
    await given('the visitor is on the first education slide', async () => {
      await page.clock.install();
      await page.goto('/education');
      await expect(page.locator('.site-carousel-position')).toHaveText('1 of 3');
    });
    await when('4.5 seconds pass without them touching it', () => page.clock.runFor(4_500));
    await then('the carousel moves to the next slide', () => expect(page.locator('.site-carousel-position')).toHaveText('2 of 3'));
  });

  test('home shows its sections stacked on phones and as a carousel on wider screens', async ({ page }) => {
    const isPhone = page.viewportSize()!.width <= 600;

    await given(`a ${isPhone ? 'phone' : 'wider'} screen`, () => {});
    await when('the visitor opens the home page', () => page.goto('/home'));
    await then(isPhone ? 'all three sections are stacked, with no carousel' : 'the sections are in a carousel, one at a time', async () => {
      await expect(page.getByRole('region', { name: 'Career overview' })).toHaveCount(isPhone ? 0 : 1);
      // Stacked, all three section headings are readable without waiting or tapping.
      const visibleHeadings = page.getByRole('heading', { level: 2 });
      await expect(visibleHeadings).toHaveCount(isPhone ? 3 : 1);
    });
  });

  test('autoplay stops for good once the visitor touches the carousel', async ({ page }) => {
    await given('the visitor is on the testimonials carousel', async () => {
      await page.clock.install();
      await page.goto('/testimonials');
    });
    await when('they touch it and 30 seconds pass', async () => {
      await page.getByRole('region', { name: 'Testimonials' }).click();
      await page.clock.runFor(30_000);
    });
    await then('it stays on the first slide and offers Play', async () => {
      await expect(page.locator('.site-carousel-position')).toHaveText(/^1 of /);
      await expect(page.getByRole('button', { name: 'Play slideshow' })).toBeVisible();
    });
  });

  test('the pause button stops autoplay and play resumes it', async ({ page }) => {
    await given('the visitor is on the education carousel', async () => {
      await page.clock.install();
      await page.goto('/education');
    });
    await when('they pause it and 20 seconds pass', async () => {
      await page.getByRole('button', { name: 'Pause slideshow' }).click();
      await page.clock.runFor(20_000);
    });
    await then('it stays on the first slide', () => expect(page.locator('.site-carousel-position')).toHaveText('1 of 3'));
    await when('they press Play and 4.5 seconds pass', async () => {
      await page.getByRole('button', { name: 'Play slideshow' }).click();
      await page.clock.runFor(4_500);
    });
    await then('it moves to the next slide', () => expect(page.locator('.site-carousel-position')).toHaveText('2 of 3'));
  });

  test('never autoplays for visitors who prefer reduced motion', async ({ page }) => {
    await given('the visitor prefers reduced motion', async () => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.clock.install();
    });
    await when('they open the charity carousel and 30 seconds pass', async () => {
      await page.goto('/charity');
      await page.clock.runFor(30_000);
    });
    await then('it stays on the first slide and offers Play', async () => {
      await expect(page.locator('.site-carousel-position')).toHaveText('1 of 5');
      await expect(page.getByRole('button', { name: 'Play slideshow' })).toBeVisible();
    });
  });

  test('previous wraps from the first slide to the last, and only the current slide is exposed', async ({ page }) => {
    const count = await given('the visitor is on the first testimonial', async () => {
      await page.goto('/testimonials');
      return slideCount(page);
    });
    await when('they press Previous', () => page.getByRole('button', { name: 'Previous slide' }).click());
    await then('the last testimonial is shown', async () => {
      await expect(page.locator('.site-carousel-position')).toHaveText(`${count} of ${count}`);
      await settled(page);
    });
    await and('only that slide is exposed to assistive technology', () =>
      expect(page.getByRole('region', { name: 'Testimonials' }).getByRole('heading', { level: 2 })).toHaveCount(1),
    );
  });
});
