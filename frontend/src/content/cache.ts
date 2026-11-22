import { CONTENT_TIMEOUT_MS, fetchContent, fetchRunningStats } from '../api/content';
import type { ContentByPage, ContentPage, RunningStats } from './types';

// Page content and running stats, kept for the visit. A page opened a second time shows at once,
// and a prefetch (see ../prefetch.ts) means even the first visit usually finds its content waiting.
// One request per page at a time: a prefetch and the page asking together share it.

const content = new Map<ContentPage, unknown>();
const pending = new Map<string, Promise<unknown>>();
let stats: RunningStats | null | undefined;

/** Runs `load` once at a time per key, giving up after CONTENT_TIMEOUT_MS. */
function once<T>(key: string, load: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const running = pending.get(key);
  if (running) return running as Promise<T>;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONTENT_TIMEOUT_MS);
  const promise = load(controller.signal).finally(() => {
    clearTimeout(timeout);
    pending.delete(key);
  });
  pending.set(key, promise);
  return promise;
}

/** The content already loaded for a page, if any. */
export function cachedContent<P extends ContentPage>(page: P): ContentByPage[P] | undefined {
  return content.get(page) as ContentByPage[P] | undefined;
}

/** Loads a page's content from the API and keeps it. Rejects on error or timeout (nothing is kept). */
export function loadContent<P extends ContentPage>(page: P): Promise<ContentByPage[P]> {
  const hit = cachedContent(page);
  if (hit) return Promise.resolve(hit);
  return once(`content:${page}`, (signal) => fetchContent(page, signal)).then((data) => {
    content.set(page, data);
    return data;
  });
}

/** The running stats if they have settled: the stats, null if they failed, undefined if not yet asked or still loading. */
export const cachedRunningStats = () => stats;

/** Loads the running stats once; settles to null on error or timeout, since they're optional. */
export function loadRunningStats(): Promise<RunningStats | null> {
  if (stats !== undefined) return Promise.resolve(stats);
  return once('stats', fetchRunningStats).then(
    (data) => (stats = data),
    () => (stats = null),
  );
}

/** For tests: forget everything. */
export function clearContentCache() {
  content.clear();
  pending.clear();
  stats = undefined;
}
