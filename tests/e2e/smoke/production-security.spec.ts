import { resolveCaa, resolveTxt } from 'node:dns/promises';
import { expect, test } from '../support/smoke-fixtures';
import { CONTENT_SECURITY_POLICY, PERMISSIONS_POLICY } from '../../../frontend/security-headers';
import { pages } from '../support/pages';
import { and, given, then, when } from '../support/steps';

// Security checks on the live site and API. Read-only: nothing here submits the contact form, and
// the few API requests are ones the API rejects, so nothing is stored or emailed. Run with
// `npm run test:security` (with the local injection tests) or on their own with
// `npm run test:security:smoke`.

const ONE_YEAR = 31_536_000;
const FOREIGN_ORIGIN = 'https://attacker.example';

test.describe('production security', { tag: '@security' }, () => {
  test.describe.configure({ mode: 'serial' });

  for (const { path } of pages) {
    test(`${path} sends the security headers`, async ({ request }) => {
      await given('the live site', () => {});
      const response = await when(`${path} is requested over HTTPS`, () => request.get(path));
      await then('it is served with HSTS for a year, nosniff, same-origin framing and a strict referrer policy', () => {
        const headers = response.headers();
        expect(response.status()).toBe(200);
        const maxAge = Number(/max-age=(\d+)/.exec(headers['strict-transport-security'] ?? '')?.[1]);
        expect(maxAge, 'HSTS max-age').toBeGreaterThanOrEqual(ONE_YEAR);
        expect(headers['strict-transport-security']).toContain('includeSubDomains');
        expect(headers['x-content-type-options']).toBe('nosniff');
        expect(headers['x-frame-options']).toMatch(/^(SAMEORIGIN|DENY)$/);
        expect(headers['referrer-policy']).toMatch(/^(strict-origin-when-cross-origin|strict-origin|same-origin|no-referrer)$/);
      });
      await and('it sends the site’s Content-Security-Policy and Permissions-Policy', () => {
        expect(response.headers()['content-security-policy']).toBe(CONTENT_SECURITY_POLICY);
        expect(response.headers()['permissions-policy']).toBe(PERMISSIONS_POLICY);
        expect(response.headers()['cross-origin-opener-policy']).toBe('same-origin');
      });
      await and('it sets no cookies and names no server software versions', () => {
        const headers = response.headers();
        expect(headers['set-cookie']).toBeUndefined();
        expect(headers['x-powered-by']).toBeUndefined();
        expect(headers['server'] ?? '').not.toMatch(/\d+\.\d+/);
      });
    });
  }

  for (const host of ['selenium-automation.com', 'www.selenium-automation.com']) {
    test(`http://${host} redirects to HTTPS`, async ({ request }) => {
      await given(`a visitor types http://${host}`, () => {});
      const response = await when('the plain-HTTP address is requested', () =>
        request.get(`http://${host}/home`, { maxRedirects: 0 }),
      );
      await then('it is permanently redirected to the HTTPS address', () => {
        expect(response.status()).toBe(301);
        const location = new URL(response.headers()['location'] ?? '', 'http://invalid.example');
        expect(location.protocol).toBe('https:');
        expect(location.host).toBe(host);
      });
    });
  }

  for (const path of ['/.env', '/.env.local', '/.git/HEAD', '/.git/config', '/package.json', '/backend/pom.xml', '/infra/template.yaml', '/index.html.bak']) {
    test(`${path} is not exposed`, { tag: '@negative' }, async ({ request }) => {
      await given('someone probing for files that would leak source or secrets', () => {});
      const response = await when(`they request ${path}`, () => request.get(path));
      await then('the request is refused, never answered with the file', () => {
        expect(response.status(), `${path} status`).toBeGreaterThanOrEqual(400);
      });
    });
  }

  test('the JavaScript has no source maps or credentials', async ({ page, request }) => {
    const scripts = new Set<string>();
    await given('the visitor loads every page', async () => {
      const siteHosts = new Set(['selenium-automation.com', 'www.selenium-automation.com']);
      page.on('response', (r) => r.url().endsWith('.js') && siteHosts.has(new URL(r.url()).hostname) && scripts.add(r.url()));
      for (const { path } of pages) await page.goto(path, { waitUntil: 'networkidle' });
    });
    await then('none of the scripts points to a source map, and none of the maps is served', async () => {
      expect(scripts.size).toBeGreaterThan(0);
      for (const url of scripts) {
        const body = await (await request.get(url)).text();
        expect(body, url).not.toContain('sourceMappingURL=');
        expect((await request.get(`${url}.map`)).status(), `${url}.map`).toBeGreaterThanOrEqual(400);
      }
    });
    await and('no script contains an AWS key, a private key or a token', async () => {
      for (const url of scripts) {
        const body = await (await request.get(url)).text();
        expect(body, url).not.toMatch(/AKIA[0-9A-Z]{16}/);
        expect(body, url).not.toMatch(/-----BEGIN [A-Z ]*PRIVATE KEY-----/);
        expect(body, url).not.toMatch(/gh[pousr]_[A-Za-z0-9]{36}/);
      }
    });
  });

  test('nothing on the live pages breaks the Content-Security-Policy', async ({ page }) => {
    await given('policy violations are being recorded', () =>
      page.addInitScript(() => {
        const w = window as unknown as { __violations: string[] };
        w.__violations = [];
        document.addEventListener('securitypolicyviolation', (e) => w.__violations.push(`${e.violatedDirective} blocked ${e.blockedURI || 'inline'}`));
      }),
    );
    for (const { path } of pages) {
      await when(`the visitor opens ${path}`, async () => {
        await page.goto(path, { waitUntil: 'networkidle' });
      });
      await then(`${path} broke no rule`, async () =>
        expect(await page.evaluate(() => (window as unknown as { __violations: string[] }).__violations)).toEqual([]),
      );
    }
  });

  test('Google Analytics works within the policy for a real visitor', async ({ page }) => {
    const collected: string[] = [];
    await given('a real (not automated) browser in the US, with policy violations recorded', async () => {
      // Test browsers never load GA, so present as a normal browser just for this check.
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        const w = window as unknown as { __violations: string[] };
        w.__violations = [];
        document.addEventListener('securitypolicyviolation', (e) => w.__violations.push(`${e.violatedDirective} blocked ${e.blockedURI}`));
      });
      // Stop GA's hits at the network so this check is never counted as a visit.
      const isAnalyticsHit = (url: URL) =>
        url.protocol === 'https:' &&
        (url.hostname.endsWith('.google-analytics.com') ||
          url.hostname.endsWith('.analytics.google.com') ||
          (url.hostname === 'www.google.com' && url.pathname.startsWith('/g/collect')));
      await page.route(isAnalyticsHit, (route) => {
        collected.push(route.request().url());
        return route.abort();
      });
    });
    const tag = page.waitForResponse((r) => {
      const url = new URL(r.url());
      return url.protocol === 'https:' && url.hostname === 'www.googletagmanager.com' && url.pathname === '/gtag/js';
    });
    await when('they open the home page and then Analytics', async () => {
      await page.goto('/home', { waitUntil: 'networkidle' });
      await page.getByRole('link', { name: 'Site analytics', exact: true }).click();
      await page.waitForLoadState('networkidle');
    });
    await then('Google’s tag loads and sends page views, and nothing breaks the policy', async () => {
      expect((await tag).status()).toBe(200);
      await expect.poll(() => collected.length, { timeout: 10_000 }).toBeGreaterThan(0);
      expect(await page.evaluate(() => (window as unknown as { __violations: string[] }).__violations)).toEqual([]);
    });
  });

  test('pages load nothing over plain HTTP', async ({ page }) => {
    const insecure: string[] = [];
    await given('every request the pages make is recorded', () => {
      page.on('request', (r) => r.url().startsWith('http://') && insecure.push(r.url()));
    });
    await when('the visitor opens every page', async () => {
      for (const { path } of pages) await page.goto(path, { waitUntil: 'networkidle' });
    });
    await then('nothing was loaded without HTTPS', () => expect(insecure).toEqual([]));
  });

  test('links that open a new tab cannot reach back into the site', async ({ page }) => {
    const unsafe: string[] = [];
    await when('the visitor opens every page', async () => {
      for (const { path } of pages) {
        await page.goto(path, { waitUntil: 'networkidle' });
        unsafe.push(
          ...(await page.locator('a[target="_blank"]').evaluateAll((links) =>
            links.filter((a) => !/\bno(opener|referrer)\b/.test(a.getAttribute('rel') ?? '')).map((a) => (a as HTMLAnchorElement).href),
          )),
        );
      }
    });
    await then('every new-tab link has rel="noopener" or "noreferrer"', () => expect(unsafe).toEqual([]));
    await and('no link runs script through a javascript: address', async () => {
      await expect(page.locator('a[href^="javascript:" i]')).toHaveCount(0);
    });
  });

  test('another website cannot call the API from a visitor’s browser', { tag: '@negative' }, async ({ request }) => {
    await given(`a page on ${FOREIGN_ORIGIN} trying to read and post to the API`, () => {});
    const read = await when('it reads page content with its own Origin', () =>
      request.get('/api/content/profile', { headers: { Origin: FOREIGN_ORIGIN } }),
    );
    await then('the browser is not allowed to read the answer', () => {
      expect(read.headers()['access-control-allow-origin']).toBeUndefined();
    });
    const preflight = await when('it asks permission to post to the contact form', () =>
      request.fetch('/api/contact', {
        method: 'OPTIONS',
        headers: { Origin: FOREIGN_ORIGIN, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
      }),
    );
    await then('permission is refused', () => {
      expect(preflight.headers()['access-control-allow-origin']).toBeUndefined();
      expect(preflight.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test('the API refuses TRACE and hides its internals in errors', { tag: '@negative' }, async ({ request }) => {
    await given('the live API', () => {});
    const trace = await when('it receives a TRACE request', () => request.fetch('/api/health', { method: 'TRACE' }));
    await then('the method is refused', () => expect(trace.status()).toBe(405));
    const broken = await when('it receives a malformed contact message', () =>
      request.post('/api/contact', { headers: { 'Content-Type': 'application/json' }, data: '{"name": <script>' }),
    );
    await then('it answers with a short error code, not a stack trace or framework name', async () => {
      expect(broken.status()).toBe(400);
      const body = await broken.text();
      expect(body).not.toMatch(/Exception|at com\.|at org\.|springframework|jackson|<script>/i);
      expect(broken.headers()['content-type']).toContain('application/json');
    });
  });

  test('nobody else can send email as the domain or get a certificate for it', async () => {
    const domain = 'selenium-automation.com';
    const txt = async (name: string) => (await resolveTxt(name)).map((parts) => parts.join(''));
    await given(`the DNS records of ${domain}`, () => {});
    await then('SPF allows no other mail server to send as it', async () => expect(await txt(domain)).toContain('v=spf1 -all'));
    await and('DMARC tells mail servers to reject mail that only claims to be from it', async () =>
      expect((await txt(`_dmarc.${domain}`)).find((r) => r.startsWith('v=DMARC1'))).toMatch(/;\s*p=reject/),
    );
    await and('only Amazon may issue its certificates, and nobody a wildcard', async () => {
      const caa = await resolveCaa(domain);
      const issuers = caa.filter((r) => r.issue).map((r) => r.issue);
      expect(issuers.length).toBeGreaterThan(0);
      expect(issuers.every((issuer) => /^(amazon\.com|amazontrust\.com|awstrust\.com|amazonaws\.com)$/.test(issuer!))).toBe(true);
      expect(caa.find((r) => r.issuewild !== undefined)?.issuewild).toBe(';');
    });
  });
});
