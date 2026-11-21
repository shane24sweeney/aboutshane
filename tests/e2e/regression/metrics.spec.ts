import { expect, test } from '../support/fixtures';
import sample from '../support/metrics.sample.json' with { type: 'json' };
import { and, given, then, when } from '../support/steps';

// The fixtures serve ./metrics.sample.json in place of the daily report's metrics.json.
test.describe('test metrics page', () => {
  test('shows the verdict, headline numbers and a donut for every suite', async ({ page }) => {
    await given('the visitor opens Test Metrics', () => page.goto('/metrics'));
    await then('the verdict and summary from the daily report are shown', async () => {
      await expect(page.getByRole('heading', { level: 2, name: sample.headline })).toBeVisible();
      await expect(page.getByText(sample.summary)).toBeVisible();
    });
    await and(`all ${sample.kpis.length} headline numbers are shown`, () =>
      expect(page.getByRole('list', { name: 'Headline numbers' }).getByRole('listitem')).toHaveCount(sample.kpis.length),
    );
    await and('development and QA each have their donuts', async () => {
      for (const name of ['UI unit tests', 'API tests', 'Regression', 'Live site', 'Load (JMeter)']) {
        await expect(page.getByRole('img', { name: new RegExp(`^${name.replace(/[()]/g, '\\$&')}:`) })).toBeVisible();
      }
    });
  });

  test('draws every test in 3D, and selecting a bar lists its tests', async ({ page }) => {
    // A still chart (no auto-rotate) so a click lands where it was aimed.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const chart = page.getByTestId('test-grid-3d');
    const panel = page.getByRole('region', { name: 'Selected tests' });

    await given('the visitor opens Test Metrics', () => page.goto('/metrics'));
    await then('the 3D chart is drawn', () => expect(chart.locator('canvas')).toBeVisible());
    await when('they click across the chart until they land on a bar', async () => {
      await chart.locator('canvas').scrollIntoViewIfNeeded();
      const box = (await chart.boundingBox())!;
      // Bars are small, so scan a grid of points across the middle of the chart.
      search: for (let fy = 0.35; fy <= 0.8; fy += 0.05) {
        for (let fx = 0.3; fx <= 0.8; fx += 0.04) {
          await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
          if ((await panel.getByRole('listitem').count()) > 0) break search;
        }
      }
    });
    await then('the panel lists that bar’s individual tests with a link to the full report', async () => {
      await expect(panel.getByRole('listitem').first()).toBeVisible();
      await expect(panel.getByRole('link', { name: 'Open in the full report' })).toHaveAttribute('href', /^https:\/\/shane24sweeney\.github\.io\/aboutshane\//);
    });
  });

  test('the table view selects the same tests from the keyboard', async ({ page }) => {
    const [key, cell] = Object.entries(sample.grid.cells).find(([, c]) => c.failed > 0)!;
    const [r = 0, c = 0] = key.split('|').map(Number);
    const area = sample.grid.rows[r]!.name;
    const panel = page.getByRole('region', { name: 'Selected tests' });

    await given('the visitor opens the table view', async () => {
      await page.goto('/metrics');
      await page.getByText('Table view').click();
    });
    await when(`they choose ${area} on ${sample.grid.columns[c]!.name}, which has a failure`, async () => {
      const row = page.getByRole('row').filter({ has: page.getByRole('rowheader', { name: area, exact: true }) });
      const button = row.getByRole('cell').nth(c).getByRole('button');
      await button.focus();
      await page.keyboard.press('Enter');
    });
    await then('its tests are listed with the failure first', async () => {
      await expect(panel.getByRole('heading', { name: `${area} · ${sample.grid.columns[c]!.name}` })).toBeVisible();
      await expect(panel.getByRole('listitem')).toHaveCount(cell.tests.length);
      await expect(panel.getByRole('listitem').first().getByRole('img', { name: 'failed' })).toBeVisible();
    });
  });

  test('explains, with a link to the report, when the metrics are unavailable', { tag: '@negative' }, async ({ page }) => {
    await given('the daily report is unreachable', () =>
      page.route('https://shane24sweeney.github.io/aboutshane/metrics.json', (route) => route.fulfill({ status: 503 })),
    );
    await when('the visitor opens Test Metrics', () => page.goto('/metrics'));
    await then('they see why, and a link to the full report', async () => {
      await expect(page.getByRole('alert')).toContainText("Today's metrics couldn't be loaded");
      await expect(page.getByRole('alert').getByRole('link')).toHaveAttribute('href', 'https://shane24sweeney.github.io/aboutshane/');
    });
  });
});
