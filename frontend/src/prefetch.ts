import { loadContent, loadRunningStats } from './content/cache';
import type { ContentPage } from './content/types';

// Makes tabs open at once. Each page's code and content start downloading as soon as a finger
// touches a tab (or a mouse hovers or the keyboard focuses it), and shortly after the first page
// has loaded the rest are fetched quietly in the background, so a tap finds everything ready.
// App.tsx's lazy() routes use the same imports, so a prefetched page is already in memory.

export const pageModules = {
  '/about': () => import('./pages/About'),
  '/charity': () => import('./pages/Charity'),
  '/contact': () => import('./pages/Contact'),
  '/education': () => import('./pages/Education'),
  '/metrics': () => import('./pages/Metrics'),
  '/resume': () => import('./pages/Resume'),
  '/running': () => import('./pages/Running'),
  '/testimonials': () => import('./pages/Testimonials'),
  '/visitors': () => import('./pages/Visitors'),
} as const;

const pageContent: Record<string, ContentPage | undefined> = {
  '/home': 'profile',
  '/about': 'about',
  '/resume': 'resume',
  '/testimonials': 'testimonials',
  '/education': 'education',
  '/charity': 'charity',
  '/running': 'running',
};

const started = new Set<string>();
/** The 3D pages' own code (three.js and the chart or globe), fetched only when a visitor reaches for them. */
const heavy: Record<string, () => Promise<unknown>> = {
  '/metrics': () => import('./components/TestGrid3D'),
  '/visitors': () => import('./components/VisitorGlobe3D'),
};
const heavyStarted = new Set<string>();

/**
 * Starts loading a page's code and content; safe to call often (each path loads once). `intent`
 * means the visitor is reaching for the tab: only then does Metrics also fetch its 3D chart
 * (137 kB), so background prefetching never spends that much of a phone's data.
 */
export function prefetchPage(path: string, { intent = false } = {}) {
  const loadHeavy = heavy[path];
  if (intent && loadHeavy && !heavyStarted.has(path)) {
    heavyStarted.add(path);
    loadHeavy().catch(() => heavyStarted.delete(path));
  }
  if (started.has(path)) return;
  started.add(path);
  const loadModule = pageModules[path as keyof typeof pageModules];
  loadModule?.().catch(() => started.delete(path));
  const page = pageContent[path];
  if (page) loadContent(page).catch(() => {});
  if (path === '/running') loadRunningStats();
}

/** True when the visitor has asked to save data, or the connection is very slow. */
function savingData() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return Boolean(connection?.saveData) || /(^|-)2g$/.test(connection?.effectiveType ?? '');
}

/** Once the page has loaded and the browser is idle, prefetches every page (unless saving data). */
export function prefetchAllWhenIdle(paths: readonly string[]): () => void {
  if (savingData()) return () => {};
  const run = () => paths.forEach((path) => prefetchPage(path));
  // Safari has no requestIdleCallback; a short delay after load does the same job there.
  const hasIdle = typeof window.requestIdleCallback === 'function';
  const idle = (callback: () => void) => (hasIdle ? window.requestIdleCallback(callback, { timeout: 4000 }) : globalThis.setTimeout(callback, 1500));
  let handle: number | undefined;
  const start = () => (handle = idle(run));
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
  return () => {
    window.removeEventListener('load', start);
    if (handle === undefined) return;
    if (hasIdle) window.cancelIdleCallback(handle);
    else globalThis.clearTimeout(handle);
  };
}

/** For tests: forget which pages have been prefetched. */
export const resetPrefetch = () => {
  started.clear();
  heavyStarted.clear();
};
