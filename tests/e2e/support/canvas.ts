import { type Locator, type Page, test } from '@playwright/test';

/**
 * Moves the pointer across a 3D view until it rests on a bar (the view's tooltip appears), and
 * returns that point, or null if no bar was found. Bars are small, so it sweeps a grid of points
 * over the middle of the view, which can take a while: it gives the test up to a minute. Use with
 * reduced motion so the view holds still.
 */
export async function hoverABar(page: Page, stage: Locator, tip: Locator): Promise<{ x: number; y: number } | null> {
  test.setTimeout(60_000);
  await stage.scrollIntoViewIfNeeded();
  const box = (await stage.boundingBox())!;
  for (let fy = 0.2; fy <= 0.85; fy += 0.03) {
    for (let fx = 0.15; fx <= 0.85; fx += 0.03) {
      const point = { x: box.x + box.width * fx, y: box.y + box.height * fy };
      await page.mouse.move(point.x, point.y);
      if (await tip.isVisible()) return point;
    }
  }
  return null;
}
