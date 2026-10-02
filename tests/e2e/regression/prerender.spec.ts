import { expect, test } from '../support/fixtures';
import { pages } from '../support/pages';
import { and, given, then, when } from '../support/steps';

// scripts/prerender.mjs writes each page's text into its HTML for tools that don't run JavaScript:
// resume parsers, recruiter tools and plain crawlers.

test.describe('pre-rendered pages', () => {
  for (const { path, heading } of pages) {
    test(`${path} has its own HTML with the page's text`, async ({ request }) => {
      await given('a client that reads HTML without running JavaScript', () => {});
      const response = await when(`it requests ${path}`, () => request.get(path));
      const html = await response.text();

      await then("the HTML holds the page's heading", () => {
        expect(response.status()).toBe(200);
        expect(html).toContain(`<h1>${heading.replaceAll('&', '&amp;')}</h1>`);
      });
      await and('points search engines and link previews at the page itself', () => {
        expect(html).toContain(`<link rel="canonical" href="https://selenium-automation.com${path}" />`);
        expect(html).toContain(`<meta property="og:url" content="https://selenium-automation.com${path}" />`);
      });
    });
  }

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('the resume shows every role, its bullets and the earlier experience', async ({ page }) => {
      await given('a browser with JavaScript turned off', () => {});
      await when('it opens the resume', () => page.goto('/resume'));
      await then('the full resume is readable', async () => {
        await expect(page.getByRole('heading', { level: 1, name: 'Professional Experience' })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Fifth Third Bank/ })).toBeVisible();
        await expect(page.getByText(/increasing automated test coverage from 45% to 80%/)).toBeVisible();
        await expect(page.getByRole('heading', { name: /GE$/ })).toBeVisible();
      });
    });

    test('the home page shows the summary and strengths', async ({ page }) => {
      await given('a browser with JavaScript turned off', () => {});
      await when('it opens the home page', () => page.goto('/home'));
      await then('the profile is readable', async () => {
        await expect(page.getByRole('heading', { level: 1, name: 'Shane James Sweeney' })).toBeVisible();
        await expect(page.getByText(/15\+ years in test automation/).first()).toBeVisible();
        // A regular expression: plain-string getByText doesn't match text that came from <noscript>.
        await expect(page.getByText(/^Mobile Automation \(Appium iOS\/Android\)$/)).toBeVisible();
      });
    });
  });

  test('with JavaScript, visitors see the normal page and not the pre-rendered text', async ({ page }) => {
    await given('a normal browser', () => {});
    await when('it opens the resume', () => page.goto('/resume'));
    await then('the interactive resume is shown', () =>
      expect(page.getByRole('button', { name: /FIFTH THIRD BANK/ })).toBeVisible(),
    );
    await and('the pre-rendered copy stays hidden', () =>
      expect(page.getByText(/^Turn on JavaScript for the full site\.$/)).toBeHidden(),
    );
  });
});
