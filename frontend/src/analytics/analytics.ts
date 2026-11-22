// Google Analytics 4 (free): page views and real visitors' speed (Core Web Vitals), so the
// Visitors tab can show where traffic comes from and how fast the site is for people.
//
// Privacy:
// - Consent Mode: in the EEA, UK and Switzerland nothing is stored until the visitor accepts
//   (ConsentBanner asks them); elsewhere analytics cookies are on unless they decline.
// - Advertising storage, ad personalisation and ad user data are always denied.
// - Nothing loads for automated browsers (our tests), local copies of the site, or visitors
//   whose browser sends Global Privacy Control or Do Not Track.

export const GA_MEASUREMENT_ID = 'G-6E90ERR71Y';
const SITE_HOST = 'selenium-automation.com';
const CONSENT_KEY = 'aboutshane.analytics-consent';

export type Consent = 'granted' | 'denied';

/** Where consent is required before any analytics storage (ISO 3166-1 codes, as Consent Mode expects). */
export const CONSENT_REGIONS = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU',
  'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'CH',
];

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

export function storedConsent(): Consent | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

function storeConsent(choice: Consent) {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    // Private mode: the choice lasts for this visit only.
  }
}

/** Europe (by the browser's time zone) is where we ask first; Google applies the rules by location too. */
export function isEuropeanTimeZone(timeZone: string | undefined) {
  return Boolean(timeZone && (timeZone.startsWith('Europe/') || ['Atlantic/Reykjavik', 'Atlantic/Canary', 'Atlantic/Madeira', 'Atlantic/Faroe'].includes(timeZone)));
}

/** Whether to ask: in Europe, until the visitor has chosen. */
export function shouldAskForConsent() {
  return storedConsent() === null && isEuropeanTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
}

/** Whether this browser may load analytics at all. */
export function analyticsAllowed(env: { webdriver?: boolean; hostname: string; doNotTrack?: string | null; globalPrivacyControl?: boolean }) {
  if (env.webdriver) return false;
  if (env.hostname !== SITE_HOST && env.hostname !== `www.${SITE_HOST}`) return false;
  if (env.globalPrivacyControl || env.doNotTrack === '1') return false;
  return true;
}

let started = false;

function gtag(...args: unknown[]) {
  window.gtag?.(...args);
}

type Environment = Parameters<typeof analyticsAllowed>[0];

function browserEnvironment(): Environment {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return { webdriver: nav.webdriver, hostname: location.hostname, doNotTrack: nav.doNotTrack, globalPrivacyControl: nav.globalPrivacyControl };
}

/**
 * Sets up Consent Mode and GA, then loads Google's script once the page is idle. Returns whether
 * analytics started. `env` is for tests; the site uses the real browser's.
 */
export function initAnalytics(env: Environment = browserEnvironment()): boolean {
  if (started) return true;
  if (!analyticsAllowed(env)) return false;
  started = true;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtagShim() {
    // GA reads the arguments object itself, exactly as Google's snippet does.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  const ads = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
  gtag('consent', 'default', { ...ads, analytics_storage: 'denied', region: CONSENT_REGIONS, wait_for_update: 500 });
  gtag('consent', 'default', { ...ads, analytics_storage: storedConsent() === 'denied' ? 'denied' : 'granted' });
  if (storedConsent() === 'granted') gtag('consent', 'update', { analytics_storage: 'granted' });
  gtag('js', new Date());
  // Page views are sent by trackPageView on each route change (this is a single-page app).
  gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });

  const load = () => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
    void reportWebVitals();
  };
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(load, { timeout: 3000 });
  else setTimeout(load, 1500);
  return true;
}

/** For tests: forget that analytics started. */
export function resetAnalytics() {
  started = false;
  delete window.gtag;
  delete window.dataLayer;
}

/** One page view per route, with the path and title the visitor saw. */
export function trackPageView(path: string) {
  gtag('event', 'page_view', { page_path: path, page_location: `https://${SITE_HOST}${path}`, page_title: document.title });
}

/** The visitor's choice from the consent banner (or Cookie settings), kept for next time. */
export function setConsent(choice: Consent) {
  storeConsent(choice);
  gtag('consent', 'update', { analytics_storage: choice });
}

/**
 * Real visitors' speed: Largest Contentful Paint, Interaction to Next Paint, Cumulative Layout
 * Shift, First Contentful Paint and Time to First Byte, as GA events. `value` is milliseconds
 * (CLS × 1000), so the Visitors tab can average them from GA's eventValue.
 */
async function reportWebVitals() {
  const { onCLS, onFCP, onINP, onLCP, onTTFB } = await import('web-vitals');
  const send = ({ name, value, id, rating }: { name: string; value: number; id: string; rating: string }) =>
    gtag('event', name, { value: Math.round(name === 'CLS' ? value * 1000 : value), metric_id: id, metric_rating: rating, non_interaction: true });
  onCLS(send);
  onFCP(send);
  onINP(send);
  onLCP(send);
  onTTFB(send);
}
