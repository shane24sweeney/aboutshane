import AxeBuilder from '@axe-core/playwright';
import type { Page, Request } from '@playwright/test';
import { expect, test } from '../support/fixtures';
import { and, given, then, when } from '../support/steps';

async function fillForm(page: Page) {
  await page.getByLabel('Name').fill('Jane Doe');
  await page.getByLabel('E-mail').fill('jane@example.com');
  await page.getByLabel('Message').fill('Hello from Playwright');
}

/** Answers the contact API with `status` and counts how many messages reach it. */
async function contactApiAnswers(page: Page, status: number, delayMs = 0) {
  const calls = { count: 0 };
  await page.route('**/api/contact', async (route) => {
    calls.count += 1;
    if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
    return route.fulfill({ status, json: { status: 'received' } });
  });
  return calls;
}

test.describe('contact form', () => {
  test.beforeEach(async ({ page }) => {
    await given('the visitor is on the contact page', () => page.goto('/contact'));
  });

  test('requires every field before sending', { tag: '@negative' }, async ({ page }) => {
    const calls = await given('the contact API would accept a message', () => contactApiAnswers(page, 202));

    await when('the visitor submits the empty form', () => page.getByRole('button', { name: 'Submit' }).click());
    await then('the browser flags the missing name', async () => {
      expect(await page.getByLabel('Name').evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true);
    });

    await when('they submit it with an invalid email address', async () => {
      await page.getByLabel('Name').fill('Jane Doe');
      await page.getByLabel('E-mail').fill('not-an-email');
      await page.getByLabel('Message').fill('Hello');
      await page.getByRole('button', { name: 'Submit' }).click();
    });
    await then('the browser flags the email address', async () => {
      expect(await page.getByLabel('E-mail').evaluate((input: HTMLInputElement) => input.validity.typeMismatch)).toBe(true);
    });
    await and('nothing was sent', () => expect(calls.count).toBe(0));
  });

  test('sends the message and confirms it', async ({ page }) => {
    let request: Request | undefined;
    const sent = page.waitForRequest('**/api/contact');

    await given('the contact API accepts messages', () => contactApiAnswers(page, 202));
    await when('the visitor fills in the form and submits it', async () => {
      await fillForm(page);
      await page.getByRole('button', { name: 'Submit' }).click();
      request = await sent;
    });
    await then('the message is posted as JSON', () => {
      expect(request?.method()).toBe('POST');
      expect(request?.postDataJSON()).toEqual({
        name: 'Jane Doe',
        email: 'jane@example.com',
        message: 'Hello from Playwright',
        website: '',
      });
    });
    await and('the visitor sees a confirmation and an empty form', async () => {
      await expect(page.getByRole('status')).toContainText('Your message was sent');
      await expect(page.getByLabel('Name')).toHaveValue('');
    });
  });

  test('explains when the server is rate limiting', { tag: '@negative' }, async ({ page }) => {
    await given('the contact API is rate limiting (429)', () => page.route('**/api/contact', (route) => route.fulfill({ status: 429 })));
    await when('the visitor submits a message', async () => {
      await fillForm(page);
      await page.getByRole('button', { name: 'Submit' }).click();
    });
    await then('they are asked to try again later, and keep their message', async () => {
      await expect(page.getByRole('alert')).toContainText('Too many messages');
      await expect(page.getByLabel('Message')).toHaveValue('Hello from Playwright');
    });
  });

  test('explains when sending fails', { tag: '@negative' }, async ({ page }) => {
    await given('the contact API cannot be reached', () =>
      page.route('**/api/contact', (route) => route.abort('connectionrefused')),
    );
    await when('the visitor submits a message', async () => {
      await fillForm(page);
      await page.getByRole('button', { name: 'Submit' }).click();
    });
    await then('they are told the server could not be reached', () =>
      expect(page.getByRole('alert')).toContainText('Could not reach the server'),
    );
  });

  for (const [status, error] of [
    [400, 'validation_failed'],
    [500, 'internal_error'],
  ] as const) {
    test(`explains when the server answers ${status}, and keeps the message`, { tag: '@negative' }, async ({ page }) => {
      await given(`the contact API answers ${status} ${error}`, () =>
        page.route('**/api/contact', (route) => route.fulfill({ status, json: { error } })),
      );
      await when('the visitor submits a message', async () => {
        await fillForm(page);
        await page.getByRole('button', { name: 'Submit' }).click();
      });
      await then('they are told it could not be sent, not that it was', async () => {
        await expect(page.getByRole('alert')).toContainText('could not be sent');
        await expect(page.getByRole('status')).toHaveCount(0);
      });
      await and('their message is kept', () => expect(page.getByLabel('Message')).toHaveValue('Hello from Playwright'));
    });
  }

  test('says which fields are blank when they hold only spaces, and sends nothing', { tag: '@negative' }, async ({ page }) => {
    const calls = await given('the contact API would accept a message', () => contactApiAnswers(page, 202));

    await when('the visitor submits a name and message of only spaces', async () => {
      await page.getByLabel('Name').fill('   ');
      await page.getByLabel('E-mail').fill('jane@example.com');
      await page.getByLabel('Message').fill('   ');
      await page.getByRole('button', { name: 'Submit' }).click();
    });
    await then('each blank field says what is missing, and the cursor moves to the first', async () => {
      await expect(page.getByText('Please enter your name.')).toBeVisible();
      await expect(page.getByText('Please enter a message.')).toBeVisible();
      await expect(page.getByLabel('Name')).toBeFocused();
      await expect(page.getByLabel('Name')).toHaveAttribute('aria-invalid', 'true');
    });
    await and('nothing was sent', () => expect(calls.count).toBe(0));
    await and('the form with its errors has no accessibility violations', async () => {
      const { violations } = await new AxeBuilder({ page }).include('form').withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(violations.map(({ id }) => id)).toEqual([]);
    });

    await when('they type a name', () => page.getByLabel('Name').fill('Jane Doe'));
    await then('the name error goes away', () => expect(page.getByText('Please enter your name.')).toBeHidden());
  });

  test('stops each field at its length limit', { tag: '@negative' }, async ({ page }) => {
    await when('the visitor enters more text than each field allows', async () => {
      await page.getByLabel('Name').fill('n'.repeat(150));
      await page.getByLabel('E-mail').fill(`${'e'.repeat(300)}@example.com`);
      await page.getByLabel('Message').fill('m'.repeat(5100));
    });
    await then('each field keeps only up to its limit', async () => {
      await expect(page.getByLabel('Name')).toHaveValue('n'.repeat(100));
      expect((await page.getByLabel('E-mail').inputValue()).length).toBe(254);
      expect((await page.getByLabel('Message').inputValue()).length).toBe(5000);
    });
  });

  test('sends one message even if Submit is clicked twice', { tag: '@negative' }, async ({ page }) => {
    const calls = await given('the contact API is slow to answer', () => contactApiAnswers(page, 202, 500));

    await when('the visitor clicks Submit, then clicks again while it is sending', async () => {
      await fillForm(page);
      await page.getByRole('button', { name: 'Submit' }).click();
      await page.getByRole('button', { name: 'Sending...' }).click({ force: true });
    });
    await then('the message is sent once and confirmed', async () => {
      await expect(page.getByRole('status')).toContainText('Your message was sent');
      expect(calls.count).toBe(1);
    });
  });

  test('keeps the spam honeypot out of sight and out of the tab order', { tag: '@negative' }, async ({ page }) => {
    const honeypot = page.locator('input[name="website"]');

    await when('the form has loaded', () => expect(page.getByRole('button', { name: 'Submit' })).toBeVisible());
    await then('the spam trap field is off screen and skipped by the keyboard', async () => {
      await expect(honeypot).not.toBeInViewport();
      await expect(honeypot).toHaveAttribute('tabindex', '-1');
    });
  });
});
