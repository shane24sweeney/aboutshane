import { test } from '@playwright/test';

/**
 * Given/When/Then steps. Each one is a Playwright step, so it shows by name in the HTML report,
 * the trace viewer, UI mode and CI logs, and a failure points at the step it happened in.
 *
 *   await given('the contact page is open', () => page.goto('/contact'));
 *   await when('the visitor submits the form', () => submit.click());
 *   await then('the message is confirmed', () => expect(status).toBeVisible());
 */
function step(keyword: string) {
  return <T>(description: string, body: () => T | Promise<T>): Promise<T> =>
    test.step(`${keyword} ${description}`, async () => body(), { box: true });
}

export const given = step('Given');
export const when = step('When');
export const then = step('Then');
export const and = step('And');
