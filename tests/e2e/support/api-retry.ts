import type { APIRequestContext, APIResponse } from '@playwright/test';

// Retrying API requests that get 429 Too Many Requests; used by the smoke tests' `request`
// fixture (./smoke-fixtures.ts). No Playwright runtime here, so unit tests can check it.

export const METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'fetch']);
export const ATTEMPTS = 4;
const MAX_WAIT_MS = 5000;

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** How long to wait before retry number `attempt` (1-based). */
export function backoffMs(response: Pick<APIResponse, 'headers'>, attempt: number) {
  const retryAfter = Number(response.headers()['retry-after']);
  return Math.min(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * attempt, MAX_WAIT_MS);
}

/** The same request context, but its requests retry on 429. */
export function retryingOn429(context: APIRequestContext): APIRequestContext {
  return new Proxy(context, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function') return value;
      if (typeof property !== 'string' || !METHODS.has(property)) return value.bind(target);
      return async (...args: unknown[]) => {
        for (let attempt = 1; ; attempt += 1) {
          const response: APIResponse = await value.apply(target, args);
          if (response.status() !== 429 || attempt === ATTEMPTS) return response;
          await sleep(backoffMs(response, attempt));
        }
      };
    },
  });
}

