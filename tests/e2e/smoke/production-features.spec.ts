import { expect, test } from '@playwright/test';
import { and, given, then, when } from '../support/steps';

// Site search, the résumé PDF and the status endpoint on the live site. Read-only.

test.describe('production features', () => {
  test('search finds the résumé and home page, and opens a result', async ({ page }) => {
    const box = page.getByRole('combobox', { name: 'Search the site' });
    const results = page.getByRole('listbox', { name: 'Search results' }).getByRole('option');

    await given('a visitor on the live site', () => page.goto('/contact'));
    await when('they search for "appium"', () => box.fill('appium'));
    await then('matches from the home page and the résumé are listed', async () => {
      await expect(results.filter({ hasText: 'Home' }).first()).toBeVisible();
      await expect(results.filter({ hasText: 'Resume' }).first()).toBeVisible();
    });
    await when('they choose a résumé match', () => results.filter({ hasText: 'Resume' }).first().click());
    await then('the résumé opens', () => expect(page).toHaveURL('/resume'));
  });

  test('GET /api/search answers JSON and rejects a one-letter query', { tag: '@negative' }, async ({ request }) => {
    const good = await when('the API is searched for "playwright"', () => request.get('/api/search?q=playwright'));
    await then('it returns matches with snippets, cacheable for 5 minutes', async () => {
      expect(good.status()).toBe(200);
      expect(good.headers()['cache-control']).toBe('max-age=300, public');
      const body = await good.json();
      expect(body.count).toBeGreaterThan(0);
      expect(body.results[0]).toEqual(expect.objectContaining({ path: expect.stringMatching(/^\//), snippet: expect.any(String) }));
    });
    const bad = await when('it is searched for one letter', () => request.get('/api/search?q=a'));
    await then('it refuses with 400 invalid_query', async () => {
      expect(bad.status()).toBe(400);
      expect((await bad.json()).error).toBe('invalid_query');
    });
  });

  test('the résumé downloads as a real PDF', async ({ request }) => {
    const response = await when('the résumé PDF is requested', () => request.get('/api/resume.pdf'));
    await then('it is a PDF named for Shane', async () => {
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toBe('application/pdf');
      expect(response.headers()['content-disposition']).toContain('Shane-James-Sweeney-Resume.pdf');
      const body = await response.body();
      expect(body.subarray(0, 5).toString()).toBe('%PDF-');
      expect(body.length).toBeGreaterThan(2000);
    });
  });

  test('GET /api/status reports the API and the latest test verdict', async ({ request }) => {
    const response = await when('the status is requested', () => request.get('/api/status'));
    await then('the API is ok, on Java, with its content counted', async () => {
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.status).toBe('ok');
      expect(body.runtime).toMatch(/^Java \d+$/);
      expect(body.content.pages).toBe(7);
    });
    await and('the daily verdict, when present, is one of the three', async () => {
      const { quality } = await response.json();
      if (quality) expect(['healthy', 'attention', 'incomplete']).toContain(quality.status);
    });
  });
});

test('GET /api/visitors answers with the export, or says it is coming', async ({ request }) => {
  const response = await when('the visitor numbers are requested', () => request.get('/api/visitors'));
  await then('it is JSON: the last 30 days, or available: false', async () => {
    expect(response.status()).toBe(200);
    const body = await response.json();
    if (body.available === false) expect(body.message).toEqual(expect.any(String));
    else {
      expect(body.version).toBe(1);
      expect(Array.isArray(body.countries)).toBe(true);
    }
  });
});
