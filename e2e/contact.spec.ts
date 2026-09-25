import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

async function fillForm(page: Page) {
  await page.getByLabel('Name').fill('Jane Doe');
  await page.getByLabel('E-mail').fill('jane@example.com');
  await page.getByLabel('Message').fill('Hello from Playwright');
}

test.describe('contact form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('requires every field before sending', async ({ page }) => {
    let calls = 0;
    await page.route('**/api/contact', (route) => {
      calls += 1;
      return route.fulfill({ status: 202, json: { status: 'received' } });
    });

    await page.getByRole('button', { name: 'Submit' }).click();
    expect(await page.getByLabel('Name').evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true);

    await page.getByLabel('Name').fill('Jane Doe');
    await page.getByLabel('E-mail').fill('not-an-email');
    await page.getByLabel('Message').fill('Hello');
    await page.getByRole('button', { name: 'Submit' }).click();
    expect(await page.getByLabel('E-mail').evaluate((input: HTMLInputElement) => input.validity.typeMismatch)).toBe(true);
    expect(calls).toBe(0);
  });

  test('sends the message and confirms it', async ({ page }) => {
    const sent = page.waitForRequest('**/api/contact');
    await page.route('**/api/contact', (route) => route.fulfill({ status: 202, json: { status: 'received' } }));

    await fillForm(page);
    await page.getByRole('button', { name: 'Submit' }).click();

    const request = await sent;
    expect(request.method()).toBe('POST');
    expect(request.postDataJSON()).toEqual({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'Hello from Playwright',
      website: '',
    });
    await expect(page.getByRole('status')).toContainText('Your message was sent');
    await expect(page.getByLabel('Name')).toHaveValue('');
  });

  test('explains when the server is rate limiting', async ({ page }) => {
    await page.route('**/api/contact', (route) => route.fulfill({ status: 429 }));
    await fillForm(page);
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('alert')).toContainText('Too many messages');
    await expect(page.getByLabel('Message')).toHaveValue('Hello from Playwright');
  });

  test('explains when sending fails', async ({ page }) => {
    await page.route('**/api/contact', (route) => route.abort('connectionrefused'));
    await fillForm(page);
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('alert')).toContainText('Could not reach the server');
  });

  test('keeps the spam honeypot out of sight and out of the tab order', async ({ page }) => {
    const honeypot = page.locator('input[name="website"]');
    await expect(honeypot).not.toBeInViewport();
    await expect(honeypot).toHaveAttribute('tabindex', '-1');
  });
});
