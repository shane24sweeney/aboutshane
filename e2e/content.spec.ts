import { expect, test } from '@playwright/test';

test.describe('home page', () => {
  test('shows the headline and outbound profile links', async ({ page }) => {
    await page.goto('/home');
    await expect(page.getByText('Senior QE Lead & Test Automation Architect')).toBeVisible();

    const linkedIn = page.getByRole('link', { name: 'LinkedIn', exact: true });
    await expect(linkedIn).toHaveAttribute('href', 'https://linkedin.com/in/shane-sweeney-37a934135');
    await expect(linkedIn).toHaveAttribute('target', '_blank');
    await expect(page.getByRole('link', { name: 'GitHub', exact: true })).toHaveAttribute('href', 'https://github.com/shane24sweeney');

    await page.getByRole('link', { name: 'Contact me' }).click();
    await expect(page).toHaveURL('/contact');
  });

  test('has search and social preview metadata', async ({ page, request }) => {
    await page.goto('/home');
    await expect(page).toHaveTitle('Shane James Sweeney | Senior QE Lead & Test Automation Architect');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Senior QE Lead/);

    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toMatch(/\/og-image\.png$/);
    const image = await request.get(new URL(ogImage ?? '').pathname);
    expect(image.ok()).toBe(true);
    expect(image.headers()['content-type']).toBe('image/png');
  });
});

test.describe('resume page', () => {
  test('expands one role at a time and shows its highlights as a list', async ({ page }) => {
    await page.goto('/resume');
    const fifthThird = page.getByRole('button', { name: /FIFTH THIRD BANK/ });
    const ameritas = page.getByRole('button', { name: /TECH QA MANAGER - AMERITAS/ });

    await fifthThird.click();
    await expect(fifthThird).toHaveAttribute('aria-expanded', 'true');
    const highlights = page.locator('.accordion-collapse.show li');
    await expect(highlights).toHaveCount(5);
    await expect(highlights.first()).toContainText('from 45% to 80%');

    await ameritas.click();
    await expect(ameritas).toHaveAttribute('aria-expanded', 'true');
    await expect(fifthThird).toHaveAttribute('aria-expanded', 'false');
  });

  test('every company logo loads', async ({ page }) => {
    await page.goto('/resume');
    const logos = page.locator('img.resume-logo');
    await expect(logos).toHaveCount(14);
    for (const logo of await logos.all()) {
      await expect(logo).toHaveJSProperty('complete', true);
      expect(await logo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    }
  });
});
