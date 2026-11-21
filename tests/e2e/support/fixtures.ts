import { readFileSync } from 'node:fs';
import { test as base } from '@playwright/test';
import { expectedRunningStats } from './running-stats';

export { expect } from '@playwright/test';

/**
 * The local preview has no backend, so serve the content API from the same content/*.json files the
 * real API is built from. Tests can register their own page.route afterwards to override it
 * (later routes take precedence). The running stats are worked out by ./running-stats.ts.
 * OpenStreetMap tiles for the race map get a blank image, so tests don't depend on (or load) OSM.
 * The Test Metrics page's metrics.json (from GitHub Pages) is served from ./metrics.sample.json.
 */
const METRICS = readFileSync(new URL('./metrics.sample.json', import.meta.url), 'utf8');
const BLANK_TILE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

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
    await page.route('https://tile.openstreetmap.org/**', (route) => route.fulfill({ contentType: 'image/png', body: BLANK_TILE }));
    await use(page);
  },
});
