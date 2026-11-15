import AxeBuilder from '@axe-core/playwright';
import type { AxeResults } from 'axe-core';
import { expect, test } from '../support/fixtures';
import { pages } from '../support/pages';
import { given, then, when } from '../support/steps';

test.describe('accessibility (axe, WCAG 2.1 A/AA)', () => {
  for (const { path } of pages) {
    test(`${path} has no serious or critical violations`, async ({ page }) => {
      let results: AxeResults | undefined;

      await given(`${path} has finished loading`, async () => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
      });
      await when('axe checks it against WCAG 2.1 A and AA', async () => {
        results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      });
      await then('it finds no serious or critical violations', () => {
        const blocking = (results?.violations ?? [])
          .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
          .map(({ id, help, nodes }) => ({ id, help, targets: nodes.map((node) => node.target.join(' ')) }));
        expect(blocking).toEqual([]);
      });
    });
  }
});
