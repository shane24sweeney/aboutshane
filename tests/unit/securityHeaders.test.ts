import { afterEach, describe, expect, it, vi } from 'vitest';
import { CONTENT_SECURITY_POLICY, PERMISSIONS_POLICY } from '../../frontend/security-headers';
import { CONSENT_REGIONS, GA_MEASUREMENT_ID, initAnalytics, resetAnalytics, setConsent } from '../../frontend/src/analytics/analytics';
import template from '../../infra/template.yaml?raw';
const directives = Object.fromEntries(
  CONTENT_SECURITY_POLICY.split('; ').map((d) => {
    const [name, ...values] = d.split(' ');
    return [name, values];
  }),
);

describe('security headers', { tags: ['security'] }, () => {
  it('CloudFront sends exactly the policy the tests run under', () => {
    expect(template).toContain(`ContentSecurityPolicy: "${CONTENT_SECURITY_POLICY}"`);
    expect(template).toContain(`Value: "${PERMISSIONS_POLICY}"`);
    // Every route uses the site's own header policy, none the generic managed one.
    expect(template).not.toContain('67f7725c-6f97-4210-82d7-5512b31e9d03');
    expect(template.match(/ResponseHeadersPolicyId: !Ref SiteSecurityHeaders/g)?.length).toBeGreaterThanOrEqual(6);
  });

  it('allows scripts only from the site and Google Analytics, with no inline code or eval', () => {
    expect(directives['script-src']).toEqual(["'self'", 'https://www.googletagmanager.com']);
    expect(CONTENT_SECURITY_POLICY).not.toContain("'unsafe-eval'");
    expect(directives['script-src']).not.toContain("'unsafe-inline'");
  });

  it('blocks plugins and framing by other sites, and keeps forms and <base> on the site', () => {
    expect(directives['object-src']).toEqual(["'none'"]);
    expect(directives['frame-src']).toEqual(["'none'"]);
    expect(directives['frame-ancestors']).toEqual(["'self'"]);
    expect(directives['form-action']).toEqual(["'self'"]);
    expect(directives['base-uri']).toEqual(["'self'"]);
    expect(directives['default-src']).toEqual(["'self'"]);
  });

  it('only connects to the site, the daily report and Google Analytics, all over HTTPS', () => {
    for (const source of directives['connect-src']!) expect(source === "'self'" || source.startsWith('https://')).toBe(true);
    expect(directives['connect-src']).toContain('https://shane24sweeney.github.io');
    expect(CONTENT_SECURITY_POLICY).not.toMatch(/(^|\s)(\*|http:|https:)(\s|;|$)/);
  });

  it('turns off the camera, microphone, location and payments', () => {
    for (const feature of ['camera', 'microphone', 'geolocation', 'payment']) expect(PERMISSIONS_POLICY).toContain(`${feature}=()`);
  });
});

describe('Google Analytics setup', { tags: ['security'] }, () => {
  afterEach(() => {
    resetAnalytics();
    localStorage.clear();
    document.querySelectorAll('script[src*="googletagmanager"]').forEach((s) => s.remove());
  });

  const realSite = { hostname: 'selenium-automation.com' };
  const calls = () => (window.dataLayer ?? []).map((args) => Array.from(args as ArrayLike<unknown>));

  it('denies all advertising storage, and analytics storage in consent regions until the visitor accepts', () => {
    expect(initAnalytics(realSite)).toBe(true);
    const defaults = calls().filter(([command, type]) => command === 'consent' && type === 'default').map(([, , settings]) => settings as Record<string, unknown>);
    expect(defaults).toHaveLength(2);
    for (const settings of defaults) {
      expect(settings).toMatchObject({ ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    }
    expect(defaults[0]).toMatchObject({ analytics_storage: 'denied', region: CONSENT_REGIONS });
    expect(CONSENT_REGIONS).toEqual(expect.arrayContaining(['IE', 'DE', 'FR', 'GB', 'CH']));
  });

  it('sends page views itself rather than letting GA guess them', () => {
    initAnalytics(realSite);
    expect(calls()).toContainEqual(['config', GA_MEASUREMENT_ID, { send_page_view: false }]);
  });

  it('loads only Google’s own tag script for this site’s ID, after the page is idle', () => {
    vi.useFakeTimers();
    vi.stubGlobal('requestIdleCallback', undefined);
    initAnalytics(realSite);
    expect(document.querySelector('script[src*="googletagmanager"]')).toBeNull();
    vi.advanceTimersByTime(2000);
    const script = document.querySelector<HTMLScriptElement>('script[src*="googletagmanager"]');
    expect(script?.src).toBe(`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`);
    expect(script?.async).toBe(true);
    vi.useRealTimers();
  });

  it('records a decline as denied for analytics storage', () => {
    initAnalytics(realSite);
    setConsent('denied');
    expect(calls()).toContainEqual(['consent', 'update', { analytics_storage: 'denied' }]);
  });

  it('never starts for automated browsers, other hosts, or visitors who opt out', { tags: ['negative'] }, () => {
    for (const env of [
      { ...realSite, webdriver: true },
      { hostname: 'localhost' },
      { hostname: 'selenium-automation.com.attacker.example' },
      { ...realSite, globalPrivacyControl: true },
      { ...realSite, doNotTrack: '1' },
    ]) {
      expect(initAnalytics(env)).toBe(false);
      expect(window.dataLayer).toBeUndefined();
    }
  });
});
