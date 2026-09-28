import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);
const localURL = 'http://localhost:4173';
const productionURL = process.env.PRODUCTION_URL ?? 'https://selenium-automation.com';
/**
 * Regression: the full suite, against the local production build with mocked APIs. Runs on every
 * push and pull request. Smoke: quick read-only checks of the live site. Runs daily and after deploys.
 */
export const regressionDir = './tests/e2e/regression';
const smokeDir = './tests/e2e/smoke';
/** Phone-only checks; they skip themselves on wider screens, so desktop leaves them out. */
const phoneLayoutSpec = /mobile\.spec\.ts/;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  // In CI, failures show in the job log (list), as annotations (github), in the job summary
  // (github-summary), and in junit.xml and the HTML report, which the workflows upload.
  reporter: isCI
    ? [
        ['html', { open: 'never' }],
        ['github'],
        ['list'],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['./tests/e2e/support/reporters/github-summary.ts'],
      ]
    : [['html', { open: 'never' }], ['list']],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Regression: local production build; the contact API is mocked so these never send email.
    {
      name: 'desktop',
      testDir: regressionDir,
      testIgnore: phoneLayoutSpec,
      use: { ...devices['Desktop Chrome'], baseURL: localURL },
    },
    // Emulated phones: Android on Chromium, iPhone on WebKit, from the smallest to the largest
    // current screens.
    ...(
      [
        ['mobile', 'Pixel 7'],
        ['mobile-small', 'Galaxy S24'],
        ['mobile-safari', 'iPhone 15'],
        ['mobile-safari-small', 'iPhone SE (3rd gen)'],
        ['mobile-safari-large', 'iPhone 15 Pro Max'],
      ] as const
    ).map(([name, device]) => ({
      name,
      testDir: regressionDir,
      use: { ...devices[device], baseURL: localURL },
    })),
    // Smoke: read-only checks against the live site and API.
    {
      name: 'production',
      testDir: smokeDir,
      use: { ...devices['Desktop Chrome'], baseURL: productionURL },
    },
    // The live site on phones: the page checks from the smoke suite plus the phone-layout checks.
    // API-only smoke tests stay desktop-only so the API's 2 req/s throttle isn't spent three times;
    // the phone-layout checks serve content from content/*.json (see support/fixtures.ts) for the same reason.
    ...(
      [
        ['production-mobile', 'Pixel 7'],
        ['production-mobile-safari', 'iPhone 15'],
      ] as const
    ).map(([name, device]) => ({
      name,
      testMatch: [/smoke\/.*\.spec\.ts/, /regression\/mobile\.spec\.ts/],
      grep: /is up|renders content from the live API|phone layout/,
      use: { ...devices[device], baseURL: productionURL },
    })),
  ],
  webServer: process.env.SKIP_WEBSERVER
    ? undefined
    : {
        // Serves the existing frontend/build output; run `npm run build` first.
        command: 'npm run preview',
        url: localURL,
        reuseExistingServer: !isCI,
        timeout: 60_000,
      },
});
