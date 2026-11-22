import type { APIRequestContext, APIResponse } from '@playwright/test';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ATTEMPTS, backoffMs, retryingOn429 } from '../e2e/support/api-retry';

const answer = (status: number, headers: Record<string, string> = {}) => ({ status: () => status, headers: () => headers }) as unknown as APIResponse;

/** A fake request context whose get() returns the given answers in turn. */
function fakeContext(...answers: APIResponse[]) {
  const get = vi.fn(async () => answers.shift()!);
  const dispose = vi.fn(async () => {});
  return { context: { get, dispose, storageState: 'state' } as unknown as APIRequestContext, get, dispose };
}

describe('retrying the live API on 429', () => {
  afterEach(() => vi.useRealTimers());

  it('waits and retries until the API answers, returning that answer', async () => {
    vi.useFakeTimers();
    const { context, get } = fakeContext(answer(429), answer(429), answer(200));
    const pending = retryingOn429(context).get('/api/health');
    await vi.advanceTimersByTimeAsync(1000 + 2000);
    expect((await pending).status()).toBe(200);
    expect(get).toHaveBeenCalledTimes(3);
  });

  it('returns other answers straight away, including real failures', async () => {
    const { context, get } = fakeContext(answer(404));
    expect((await retryingOn429(context).get('/api/nope')).status()).toBe(404);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it(`gives up after ${ATTEMPTS} attempts and returns the last 429`, async () => {
    vi.useFakeTimers();
    const { context, get } = fakeContext(...Array.from({ length: ATTEMPTS + 2 }, () => answer(429)));
    const pending = retryingOn429(context).get('/api/health');
    await vi.advanceTimersByTimeAsync(20_000);
    expect((await pending).status()).toBe(429);
    expect(get).toHaveBeenCalledTimes(ATTEMPTS);
  });

  it('honours Retry-After, within a 5-second cap', () => {
    expect(backoffMs(answer(429, { 'retry-after': '2' }), 1)).toBe(2000);
    expect(backoffMs(answer(429, { 'retry-after': '60' }), 1)).toBe(5000);
    expect(backoffMs(answer(429), 3)).toBe(3000);
  });

  it('leaves everything else about the request context as it was', async () => {
    const { context, dispose } = fakeContext();
    const wrapped = retryingOn429(context);
    await wrapped.dispose();
    expect(dispose).toHaveBeenCalledTimes(1);
    expect((wrapped as unknown as { storageState: string }).storageState).toBe('state');
  });
});
