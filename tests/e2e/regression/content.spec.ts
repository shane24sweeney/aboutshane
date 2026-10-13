import type { APIResponse } from '@playwright/test';
import { expect, test } from '../support/fixtures';
import { and, given, then, when } from '../support/steps';

test.describe('home page', () => {
  test('shows the headline and outbound profile links', async ({ page }) => {
    const main = page.getByRole('main');
    const linkedIn = main.getByRole('link', { name: 'LinkedIn', exact: true });

    await given('the visitor opens the home page', () => page.goto('/home'));
    await then('the headline and profile links are shown', async () => {
      await expect(page.getByText('Senior QE & Mobile Automation Consultant')).toBeVisible();
      await expect(linkedIn).toHaveAttribute('href', 'https://linkedin.com/in/shane-sweeney-37a934135');
      await expect(linkedIn).toHaveAttribute('target', '_blank');
      await expect(main.getByRole('link', { name: 'GitHub', exact: true })).toHaveAttribute('href', 'https://github.com/shane24sweeney');
    });
    await when('they click Contact me', () => main.getByRole('link', { name: 'Contact me' }).click());
    await then('the contact page opens', () => expect(page).toHaveURL('/contact'));
  });

  test('has search and social preview metadata', async ({ page, request }) => {
    let ogImage: string | null = null;
    let image: APIResponse | undefined;

    await given('the home page is open', () => page.goto('/home'));
    await then('it has a title and description for search results', async () => {
      await expect(page).toHaveTitle('Shane James Sweeney | Senior QE & Mobile Automation Consultant');
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Senior QE and Mobile Automation Consultant/);
    });
    await and('it names a social preview image', async () => {
      ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
      expect(ogImage).toMatch(/\/og-image\.png$/);
    });
    await when('the preview image is requested', async () => {
      image = await request.get(new URL(ogImage ?? '').pathname);
    });
    await then('it is served as a PNG', () => {
      expect(image?.ok()).toBe(true);
      expect(image?.headers()['content-type']).toBe('image/png');
    });
  });
});

test.describe('footer', () => {
  test('links to LinkedIn, GitHub and the contact form without publishing the email address', async ({ page }) => {
    const footer = page.getByRole('contentinfo');

    await given('the visitor is on any page', () => page.goto('/resume'));
    await then('the footer shows the name, location and profile links', async () => {
      await expect(footer).toContainText('Shane James Sweeney');
      await expect(footer).toContainText('Kennesaw, GA');
      await expect(footer.getByRole('link', { name: 'LinkedIn', exact: true })).toHaveAttribute('href', 'https://linkedin.com/in/shane-sweeney-37a934135');
      await expect(footer.getByRole('link', { name: 'GitHub', exact: true })).toHaveAttribute('href', 'https://github.com/shane24sweeney');
    });
    await and('no email address is published', () => expect(footer.locator('a[href^="mailto:"]')).toHaveCount(0));
    await when('they click Contact in the footer', () => footer.getByRole('link', { name: 'Contact', exact: true }).click());
    await then('the contact page opens', () => expect(page).toHaveURL('/contact'));
  });
});

test.describe('resume page', () => {
  test('opens the most recent role, then one role at a time, each with dates and highlights', async ({ page }) => {
    const fifthThird = page.getByRole('button', { name: /FIFTH THIRD BANK/ });
    const ameritas = page.getByRole('button', { name: /TECH QA MANAGER - AMERITAS/ });
    const highlights = page.locator('.accordion-collapse.show li');

    await given('the visitor opens the resume', () => page.goto('/resume'));
    await then('the most recent role is open with its dates and highlights', async () => {
      await expect(fifthThird).toHaveAttribute('aria-expanded', 'true');
      await expect(fifthThird).toContainText('2026');
      await expect(fifthThird).not.toContainText('Present');
      await expect(ameritas).toContainText('2023 – 2025');
      await expect(highlights).toHaveCount(8);
      await expect(highlights.first()).toContainText('from 45% to 80%');
    });
    await when('they open an earlier role', () => ameritas.click());
    await then('that role opens and the most recent role closes', async () => {
      await expect(ameritas).toHaveAttribute('aria-expanded', 'true');
      await expect(fifthThird).toHaveAttribute('aria-expanded', 'false');
    });
  });

  test('every company logo loads', async ({ page }) => {
    const logos = page.locator('img.resume-logo');

    await given('the resume lists 9 roles, each with a company logo', () => {});
    await when('the visitor opens the resume', () => page.goto('/resume'));
    await then('all 9 company logos have loaded', async () => {
      await expect(logos).toHaveCount(9);
      for (const logo of await logos.all()) {
        await expect(logo).toHaveJSProperty('complete', true);
        expect(await logo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
      }
    });
  });
});
