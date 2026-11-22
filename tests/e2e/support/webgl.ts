import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Checks a 3D view: drawn on a canvas where the browser has WebGL, otherwise the "can't draw 3D"
 * message (the page's table or list has the same numbers). Only headless Firefox on Linux (the CI
 * runners) is allowed to lack WebGL, so Chrome, Edge and Safari losing it still fails the test.
 * Returns whether the view was drawn in 3D.
 */
export async function expect3D(page: Page, stage: Locator): Promise<boolean> {
  const webgl = await page.evaluate(() => !!document.createElement('canvas').getContext('webgl'));
  if (!webgl) {
    expect(page.context().browser()?.browserType().name(), 'only headless Firefox on Linux may lack WebGL').toBe('firefox');
    await expect(stage.getByText("This browser can't draw 3D.")).toBeVisible();
    return false;
  }
  await expect(stage.locator('canvas')).toBeVisible();
  return true;
}
