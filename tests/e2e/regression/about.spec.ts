import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../support/fixtures';
import { and, given, then, when } from '../support/steps';

// The About page's Apple Fitness medals: one per slide, each spinning in like the Fitness app and
// turning when dragged. Medals come from frontend/src/content/medals.ts.

const slide = (page: Page) => page.getByRole('region', { name: 'About Shane' }).locator('.carousel-item.active');
const medalBody = (page: Page) => slide(page).locator('.spinning-medal-body');
/** The Y rotation, in degrees, of a CSS transform matrix (0 when facing front). */
const turn = (body: Locator) =>
  body.evaluate((element) => {
    const { m11, m13 } = new DOMMatrix(getComputedStyle(element).transform);
    return Math.round((Math.atan2(-m13, m11) * 180) / Math.PI) || 0;
  });

test.describe('about page: fitness medals', () => {
  test.use({ reducedMotion: 'reduce' });

  test('every medal slide has the same layout: medal, name and detail', async ({ page }) => {
    await given('the visitor is on the about page', () => page.goto('/about'));
    await when('they move to the first medal', () => page.getByRole('button', { name: 'Next slide' }).click());
    await then('it shows the medal, its name and what Apple recorded', async () => {
      await expect(slide(page).getByRole('img', { name: 'Move Goal 200% medal' })).toBeVisible();
      await expect(slide(page).getByRole('heading', { level: 2 })).toHaveText('Move Goal 200%');
      await expect(slide(page)).toContainText('Nov 14, 2026');
      await expect(slide(page)).toContainText('Burned twice the daily Move goal in one day.');
    });
    await and('the medal is the same size as every other', async () => {
      const box = (await slide(page).locator('.spinning-medal').boundingBox())!;
      expect(Math.round(box.width)).toBe(Math.round(box.height));
    });
  });

  test('dragging a medal spins it, and it comes to rest facing front', async ({ page }, testInfo) => {
    // Playwright can't drag with a finger, and its iPhone emulation ignores the mouse, so on touch
    // devices send the touch pointer events a finger would.
    const medal = slide(page).locator('.spinning-medal');
    const touch = Boolean(testInfo.project.use.hasTouch);
    const pointer = (type: string, x: number, y: number) =>
      medal.dispatchEvent(type, { pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, bubbles: true });

    await given('the visitor is looking at a medal', async () => {
      await page.goto('/about');
      await page.getByRole('button', { name: 'Next slide' }).click();
      // Clicking Next can scroll the page; bring the whole medal on screen, as a visitor would.
      await medal.scrollIntoViewIfNeeded();
    });
    const box = (await medal.boundingBox())!;

    const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];

    await when('they drag it sideways', async () => {
      if (touch) {
        await pointer('pointerdown', x, y);
        for (let step = 1; step <= 6; step += 1) await pointer('pointermove', x + step * 10, y);
      } else {
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x + 60, y, { steps: 6 });
      }
    });
    await then('the medal turns with the drag', async () => expect(Math.abs(await turn(medalBody(page)))).toBeGreaterThan(20));
    await when('they let go', () => (touch ? pointer('pointerup', x + 60, y) : page.mouse.up()));
    await then('it settles facing front', () => expect.poll(() => turn(medalBody(page))).toBe(0));
    await and('the carousel stays on the same medal', () =>
      expect(slide(page).getByRole('heading', { level: 2 })).toHaveText('Move Goal 200%'),
    );
  });
});
