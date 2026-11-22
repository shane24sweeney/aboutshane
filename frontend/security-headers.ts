// The site's Content-Security-Policy and extra security headers. CloudFront sends them in
// production (SiteSecurityHeaders in infra/template.yaml, which must match: a unit test checks),
// and the local preview server sends them too, so every Playwright test runs under the policy.
//
// - scripts: the site itself and Google Analytics' tag (no inline scripts, no eval)
// - styles: the site, plus inline style attributes (React and Leaflet set element styles)
// - images: the site, data: URIs (Bootstrap icons), map tiles, and Google Analytics' pixels
// - connections: the site's API, the daily report's JSON on GitHub Pages, and Google Analytics
//   (GA4 also sends to www.google.com/g/collect; allowed for connections and images only)
// - nothing may frame the site but itself; no plugins; forms and <base> stay on the site

export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://tile.openstreetmap.org https://*.google-analytics.com https://*.googletagmanager.com https://www.google.com",
  "font-src 'self' data:",
  "connect-src 'self' https://shane24sweeney.github.io https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.google.com",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  // No upgrade-insecure-requests: HSTS already forces HTTPS and every address here is https://,
  // and WebKit would apply it to the local preview (http://localhost), breaking the tests.
].join('; ');

/** Turns off browser features the site never uses. */
export const PERMISSIONS_POLICY = 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()';

/** The headers the preview server sends (CloudFront sends these plus HSTS). */
export const SECURITY_HEADERS = {
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
  'Permissions-Policy': PERMISSIONS_POLICY,
  'Cross-Origin-Opener-Policy': 'same-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};
