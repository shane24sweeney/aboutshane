// Guards for the Google Analytics export. GA's measurement ID is public by design, so anyone can
// send it made-up visits; these keep the published visitors.json to real visits on this site, and
// to values the page can show safely (it also renders them as text, never HTML).

/** The site's own hosts: visits recorded anywhere else (copied tags, spam hits) are left out. */
export const SITE_HOSTS = ['selenium-automation.com', 'www.selenium-automation.com'];

/** A GA Data API filter that keeps only visits recorded on the site's own hosts. */
export const onSiteOnly = { filter: { fieldName: 'hostName', inListFilter: { values: SITE_HOSTS } } };

/** Combines the site-only filter with a report's own filter, if it has one. */
export const withSiteFilter = (filter) => (filter ? { andGroup: { expressions: [onSiteOnly, filter] } } : onSiteOnly);

/** A count GA might return: whole, finite and not negative, or 0. */
export const count = (value) => (Number.isFinite(value) && value >= 0 ? Math.round(value) : 0);

/** A non-negative number (seconds, rates), rounded to `digits` places, or 0. */
export const amount = (value, digits = 0) => (Number.isFinite(value) && value >= 0 ? Number(value.toFixed(digits)) : 0);

/** Plain text of at most `max` characters, with control characters and angle brackets removed. */
export const text = (value, max = 60) =>
  String(value ?? '')
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .trim()
    .slice(0, max);

/** A two-letter ISO country code, or null. */
export const countryCode = (value) => (/^[A-Z]{2}$/.test(value ?? '') ? value : null);

/** A path on this site (/ then URL-safe characters, at most 100), or null. */
export const pagePath = (value) => (typeof value === 'string' && value.length <= 100 && /^\/[A-Za-z0-9\-._~/%]*$/.test(value) ? value : null);
