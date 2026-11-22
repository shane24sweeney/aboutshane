import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { type Page, test as base } from '@playwright/test';
import { expectedRunningStats } from './running-stats';
import { PDF_FIXTURE, STATUS_FIXTURE, searchFixture } from './search';

export { expect } from '@playwright/test';

/**
 * The local preview has no backend, so serve the content API from the same content/*.json files the
 * real API is built from. Tests can register their own page.route afterwards to override it
 * (later routes take precedence). The running stats are worked out by ./running-stats.ts.
 * OpenStreetMap tiles for the race map get a blank image, so tests don't depend on (or load) OSM.
 * The Metrics page's metrics.json (from GitHub Pages) is served from ./metrics.sample.json.
 * Search, status and the résumé PDF are served by ./search.ts; visitor numbers by ./visitors.sample.json.
 */
const METRICS = readFileSync(new URL('./metrics.sample.json', import.meta.url), 'utf8');
const VISITORS = readFileSync(new URL('./visitors.sample.json', import.meta.url), 'utf8');
const BLANK_TILE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

/**
 * Browser code coverage (`npm run test:coverage:browser`). The coverage build counts what runs into
 * window.__coverage__; save it to coverage-browser/ before anything that replaces the page (goto,
 * reload) and when the test ends, so scripts/coverage/merge.mjs can add it to the unit-test coverage.
 * A normal build has no window.__coverage__, so this does nothing.
 */
const COVERAGE_DIR = new URL('../../../coverage-browser/', import.meta.url);

async function saveCoverage(page: Page) {
  if (page.isClosed()) return;
  const coverage = await page.evaluate(() => (window as { __coverage__?: unknown }).__coverage__).catch(() => undefined);
  if (!coverage) return;
  mkdirSync(COVERAGE_DIR, { recursive: true });
  writeFileSync(new URL(`${randomUUID()}.json`, COVERAGE_DIR), JSON.stringify(coverage));
}

function collectCoverage(page: Page) {
  for (const method of ['goto', 'reload'] as const) {
    const original = page[method].bind(page) as (...args: unknown[]) => Promise<unknown>;
    (page as unknown as Record<string, unknown>)[method] = async (...args: unknown[]) => {
      await saveCoverage(page);
      return original(...args);
    };
  }
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route(/\/api\/content\/([a-z]+)$/, (route) => {
      const name = /\/api\/content\/([a-z]+)$/.exec(route.request().url())?.[1] ?? '';
      try {
        const body = readFileSync(new URL(`../../../content/${name}.json`, import.meta.url), 'utf8');
        return route.fulfill({ contentType: 'application/json', body });
      } catch {
        return route.fulfill({ status: 404, json: { error: 'request_rejected' } });
      }
    });
    await page.route('**/api/content/running/stats', (route) => route.fulfill({ json: expectedRunningStats() }));
    await page.route('https://shane24sweeney.github.io/aboutshane/metrics.json', (route) =>
      route.fulfill({ contentType: 'application/json', body: METRICS }),
    );
    await page.route('**/api/search?**', (route) => {
      const q = (new URL(route.request().url()).searchParams.get('q') ?? '').trim();
      return q.length < 2 || q.length > 100
        ? route.fulfill({ status: 400, json: { error: 'invalid_query' } })
        : route.fulfill({ json: searchFixture(q) });
    });
    await page.route('**/api/visitors', (route) => route.fulfill({ contentType: 'application/json', body: VISITORS }));
    await page.route('**/api/status', (route) => route.fulfill({ json: STATUS_FIXTURE }));
    await page.route('**/api/resume.pdf', (route) =>
      route.fulfill({
        body: PDF_FIXTURE,
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="Shane-James-Sweeney-Resume.pdf"' },
      }),
    );
    await page.route('https://tile.openstreetmap.org/**', (route) => route.fulfill({ contentType: 'image/png', body: BLANK_TILE }));
    if (process.env.COVERAGE === '1') collectCoverage(page);
    await use(page);
    if (process.env.COVERAGE === '1') await saveCoverage(page);
  },
});
