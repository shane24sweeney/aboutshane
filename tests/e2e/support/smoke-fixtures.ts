import { test as base } from '@playwright/test';
import { retryingOn429 } from './api-retry';

export { expect } from '@playwright/test';

// The live API allows 2 requests a second (with bursts of 10) to keep spam and costs down. Many
// smoke tests run at once, so they can briefly exceed that and get 429 Too Many Requests, which
// says nothing about whether the site works. Every API request a smoke test makes therefore waits
// and retries on 429: the API's Retry-After if it sends one, otherwise 1, 2, then 3 seconds.
// Any other answer, including a real failure, is returned as is. The API's limit is unchanged.

/** Playwright's test, with a `request` fixture whose calls retry on 429. */
export const test = base.extend({
  request: async ({ request }, use) => {
    await use(retryingOn429(request));
  },
});
