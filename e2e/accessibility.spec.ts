import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { pages } from './pages';

test.describe('accessibility (axe, WCAG 2.1 A/AA)', () => {
  for (const { path } of pages) {
    test(`${path} has no serious or critical violations`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const blocking = results.violations
        .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
        .map(({ id, help, nodes }) => ({ id, help, targets: nodes.map((node) => node.target.join(' ')) }));
      expect(blocking).toEqual([]);
    });
  }
});
