import type { Locator, Page } from '@playwright/test';

/**
 * Rests the pointer on a bar in a 3D view (its tooltip appears) and returns that point, or null if
 * no bar was found. Bars are thin and may be anywhere, so rather than sweep blindly it looks for
 * them: it screenshots the view, finds the pixels drawn in the bars' colours, and tries the densest
 * spots first. Use with reduced motion so the view holds still between the screenshot and the hover.
 */
export async function hoverABar(page: Page, stage: Locator, tip: Locator, colours: string[]): Promise<{ x: number; y: number } | null> {
  await stage.scrollIntoViewIfNeeded();
  // Give the first frames time to draw before the screenshot.
  await page.waitForTimeout(500);
  const box = (await stage.boundingBox())!;
  const png = (await stage.screenshot()).toString('base64');
  const spots = await page.evaluate(
    async ({ png, colours, width, height }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${png}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      [canvas.width, canvas.height] = [width, height];
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0, width, height);
      const { data } = context.getImageData(0, 0, width, height);
      const targets = colours.map((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)));
      // Count bar-coloured pixels in 6px cells, then return the cells with the most, centre first.
      const cells = new Map<string, number>();
      for (let y = 0; y < height; y += 2) {
        for (let x = 0; x < width; x += 2) {
          const i = (y * width + x) * 4;
          const near = targets.some(([r, g, b]) => Math.abs(data[i]! - r!) + Math.abs(data[i + 1]! - g!) + Math.abs(data[i + 2]! - b!) < 90);
          if (near) {
            const key = `${Math.floor(x / 6)}|${Math.floor(y / 6)}`;
            cells.set(key, (cells.get(key) ?? 0) + 1);
          }
        }
      }
      return [...cells]
        .filter(([, count]) => count >= 4)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 60)
        .map(([key]) => key.split('|').map((n) => Number(n) * 6 + 3) as [number, number]);
    },
    { png, colours, width: Math.round(box.width), height: Math.round(box.height) },
  );
  for (const [x, y] of spots) {
    const point = { x: box.x + x, y: box.y + y };
    await page.mouse.move(point.x, point.y);
    if (await tip.isVisible()) return point;
  }
  return null;
}
