import { readFileSync } from 'node:fs';
import { test as base } from '@playwright/test';

export { expect } from '@playwright/test';

/**
 * The local preview has no backend, so serve the content API from the same content/*.json files the
 * real API is built from. Tests can register their own page.route afterwards to override it
 * (later routes take precedence).
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route(/\/api\/content\/([a-z]+)$/, (route) => {
      const name = /\/api\/content\/([a-z]+)$/.exec(route.request().url())?.[1] ?? '';
      try {
        const body = readFileSync(new URL(`../content/${name}.json`, import.meta.url), 'utf8');
        return route.fulfill({ contentType: 'application/json', body });
      } catch {
        return route.fulfill({ status: 404, json: { error: 'request_rejected' } });
      }
    });
    await use(page);
  },
});
