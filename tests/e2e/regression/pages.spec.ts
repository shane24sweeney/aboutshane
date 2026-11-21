import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../support/fixtures';
import about from '../../../content/about.json' with { type: 'json' };
import charity from '../../../content/charity.json' with { type: 'json' };
import education from '../../../content/education.json' with { type: 'json' };
import testimonials from '../../../content/testimonials.json' with { type: 'json' };
import { and, given, then, when } from '../support/steps';

// Page-by-page content checks; the running page has its own spec, running.spec.ts. Locally the
// content API is served from content/*.json by the fixture in ../support/fixtures.ts, so each test
// walks the same entries the live API serves.

/** Passes once the image has downloaded and decoded to a real picture (not a broken icon). */
async function expectImageLoaded(image: Locator) {
  await expect
    .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth), {
      message: `image "${(await image.getAttribute('alt')) ?? ''}" loads`,
    })
    .toBeGreaterThan(0);
}

/**
 * The slide the carousel has settled on. While sliding, Bootstrap marks both the outgoing and the
 * incoming slide active and adds carousel-item-start/end; once it settles only the new one is left.
 */
function currentSlide(page: Page, label: string) {
  return page
    .getByRole('region', { name: label })
    .locator('.carousel-item.active:not(.carousel-item-start):not(.carousel-item-end)');
}

async function nextSlide(page: Page) {
  await page.getByRole('button', { name: 'Next slide' }).click();
}

test.describe('testimonials page', () => {
  test('shows every testimonial in order, each with name, title and quote', async ({ page }) => {
    await given('the visitor is on the testimonials page', () => page.goto('/testimonials'));

    for (const [index, { name, title, recommendation }] of testimonials.entries()) {
      const slide = currentSlide(page, 'Testimonials');
      await then(`slide ${index + 1} of ${testimonials.length} is ${name}`, async () => {
        await expect(page.locator('.site-carousel-position')).toHaveText(`${index + 1} of ${testimonials.length}`);
        await expect(slide.getByRole('heading', { level: 2 })).toHaveText(name);
        await expect(slide.locator('.testimonial-title')).toHaveText(title);
        await expect(slide.locator('blockquote')).toHaveText(recommendation);
      });
      if (index < testimonials.length - 1) await when('they press Next', () => nextSlide(page));
    }
  });

  test('every testimonial photo loads', async ({ page }) => {
    const withPhotos = testimonials.filter((entry) => 'photo' in entry && entry.photo);

    await given('the visitor is on the testimonials page', () => page.goto('/testimonials'));
    await then(`all ${withPhotos.length} photos load`, async () => {
      for (const { name } of withPhotos) {
        await expectImageLoaded(page.getByRole('img', { name, includeHidden: true }));
      }
    });
  });

  test('a testimonial without a photo shows no image', { tag: '@negative' }, async ({ page }) => {
    await given('the content API returns a testimonial with no photo', () =>
      page.route('**/api/content/testimonials', (route) =>
        route.fulfill({ json: [{ name: 'No Photo Person', title: 'Engineer', recommendation: 'Great to work with.' }] }),
      ),
    );
    await when('the visitor opens the testimonials page', () => page.goto('/testimonials'));
    await then('the testimonial is shown without an image or carousel controls', async () => {
      const region = page.getByRole('region', { name: 'Testimonials' });
      await expect(region.getByRole('heading', { level: 2 })).toHaveText('No Photo Person');
      await expect(region.locator('img')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Next slide' })).toHaveCount(0);
    });
  });
});

test.describe('education page', () => {
  test('shows every degree at once with its school logo and a credited campus photo', async ({ page }) => {
    const cards = page.getByRole('list', { name: 'Degrees' }).getByRole('listitem');

    await given('the visitor is on the education page', () => page.goto('/education'));
    await then(`all ${education.length} degrees are on the page, with no carousel to click through`, async () => {
      await expect(cards).toHaveCount(education.length);
      await expect(page.getByRole('button', { name: 'Next slide' })).toHaveCount(0);
    });

    for (const [index, { degree, school, campus }] of education.entries()) {
      const card = cards.nth(index);
      await then(`card ${index + 1} is ${degree}`, async () => {
        await expect(card.getByRole('heading', { level: 2 })).toHaveText(degree);
        await expect(card).toBeVisible();
        await expectImageLoaded(card.getByRole('img', { name: `${school} logo` }));
      });
      await and(`it shows the campus, credited to ${campus.author} under ${campus.license.label}`, async () => {
        await expectImageLoaded(card.getByRole('img', { name: campus.alt }));
        await expect(card.locator('figcaption')).toContainText(`Photo: ${campus.author}`);
        const license = card.getByRole('link', { name: campus.license.label });
        await expect(license).toHaveAttribute('href', campus.license.href);
        await expect(license).toHaveAttribute('target', '_blank');
        await expect(card.getByRole('link', { name: campus.source.label })).toHaveAttribute('href', campus.source.href);
      });
    }
  });
});

test.describe('charity page', () => {
  test('shows every charity event at once with its photo, and outside links open in a new tab', async ({ page }) => {
    const cards = page.getByRole('list', { name: 'Charities' }).getByRole('listitem');

    await given('the visitor is on the charity page', () => page.goto('/charity'));
    await then(`all ${charity.length} charities are on the page, with no carousel to click through`, async () => {
      await expect(cards).toHaveCount(charity.length);
      await expect(page.getByRole('button', { name: 'Next slide' })).toHaveCount(0);
    });

    for (const [index, event] of charity.entries()) {
      const card = cards.nth(index);
      await then(`card ${index + 1} is "${event.title}"`, async () => {
        await expect(card.getByRole('heading', { level: 2 })).toHaveText(event.title);
        await expectImageLoaded(card.getByRole('img', { name: event.alt }));
      });
      if ('link' in event && event.link) {
        const { href, label } = event.link;
        await and(`its "${label}" link opens ${href} in a new tab`, async () => {
          const link = card.getByRole('button', { name: label });
          await expect(link).toHaveAttribute('href', href);
          await expect(link).toHaveAttribute('target', '_blank');
          await expect(link).toHaveAttribute('rel', /noreferrer/);
        });
      }
    }
  });
});

test.describe('about page', () => {
  test('opens on the essay and signature from the content API', async ({ page }) => {
    const slide = currentSlide(page, 'About Shane');

    await given('the visitor is on the about page', () => page.goto('/about'));
    await then('the first slide is the essay, signed', async () => {
      await expect(slide.locator('p')).toHaveText(about.essay.split(/\n\s*\n/));
      await expect(slide.locator('cite')).toHaveText(about.signature);
    });
    await when('they press Next', () => nextSlide(page));
    await then('the next slide is a medal whose image loads', () => expectImageLoaded(currentSlide(page, 'About Shane').getByRole('img')));
  });
});

test.describe('contact page', () => {
  test('introduces the roles and the charity work Shane is open to', async ({ page }) => {
    const intro = page.locator('.contact-intro');

    await given('the visitor is on the contact page', () => page.goto('/contact'));
    await then('the intro names the roles first, then the charity work', async () => {
      await expect(intro).toContainText('Senior SDET, automation, and QA engineering roles');
      await expect(intro).toContainText('architect, engineering manager, or developer roles across frontend and backend');
      await expect(intro).toContainText('dog rescues, dementia care, and cancer research');
    });
  });
});
