import type { Page } from '@playwright/test';
import { expect, test } from '../support/fixtures';

async function fillForm(page: Page) {
  await page.getByLabel('Name').fill('Jane Doe');
  await page.getByLabel('E-mail').fill('jane@example.com');
  await page.getByLabel('Message').fill('Hello from Playwright');
}

test.describe('contact form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('requires every field before sending', { tag: '@negative' }, async ({ page }) => {
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

  test('explains when the server is rate limiting', { tag: '@negative' }, async ({ page }) => {
    await page.route('**/api/contact', (route) => route.fulfill({ status: 429 }));
    await fillForm(page);
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('alert')).toContainText('Too many messages');
    await expect(page.getByLabel('Message')).toHaveValue('Hello from Playwright');
  });

  test('explains when sending fails', { tag: '@negative' }, async ({ page }) => {
    await page.route('**/api/contact', (route) => route.abort('connectionrefused'));
    await fillForm(page);
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('alert')).toContainText('Could not reach the server');
  });

  for (const [status, error] of [
    [400, 'validation_failed'],
    [500, 'internal_error'],
  ] as const) {
    test(`explains when the server answers ${status}, and keeps the message`, { tag: '@negative' }, async ({ page }) => {
      await page.route('**/api/contact', (route) => route.fulfill({ status, json: { error } }));
      await fillForm(page);
      await page.getByRole('button', { name: 'Submit' }).click();
      await expect(page.getByRole('alert')).toContainText('could not be sent');
      await expect(page.getByRole('status')).toHaveCount(0);
      await expect(page.getByLabel('Message')).toHaveValue('Hello from Playwright');
    });
  }

  test('stops each field at its length limit', { tag: '@negative' }, async ({ page }) => {
    await page.getByLabel('Name').fill('n'.repeat(150));
    await page.getByLabel('E-mail').fill(`${'e'.repeat(300)}@example.com`);
    await page.getByLabel('Message').fill('m'.repeat(5100));
    await expect(page.getByLabel('Name')).toHaveValue('n'.repeat(100));
    expect((await page.getByLabel('E-mail').inputValue()).length).toBe(254);
    expect((await page.getByLabel('Message').inputValue()).length).toBe(5000);
  });

  test('sends one message even if Submit is clicked twice', { tag: '@negative' }, async ({ page }) => {
    let calls = 0;
    await page.route('**/api/contact', async (route) => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 500));
      return route.fulfill({ status: 202, json: { status: 'received' } });
    });
    await fillForm(page);
    const submit = page.getByRole('button', { name: 'Submit' });
    await submit.click();
    await page.getByRole('button', { name: 'Sending...' }).click({ force: true });
    await expect(page.getByRole('status')).toContainText('Your message was sent');
    expect(calls).toBe(1);
  });

  test('keeps the spam honeypot out of sight and out of the tab order', { tag: '@negative' }, async ({ page }) => {
    const honeypot = page.locator('input[name="website"]');
    await expect(honeypot).not.toBeInViewport();
    await expect(honeypot).toHaveAttribute('tabindex', '-1');
  });
});
