import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);
const localURL = 'http://localhost:4173';
const productionURL = process.env.PRODUCTION_URL ?? 'https://selenium-automation.com';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [['html', { open: 'never' }], ['github'], ['list']] : [['html', { open: 'never' }], ['list']],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Local production build; the contact API is mocked so these never send email.
    {
      name: 'desktop',
      testIgnore: [/production\.spec\.ts/, /mobile\.spec\.ts/],
      use: { ...devices['Desktop Chrome'], baseURL: localURL },
    },
    {
      name: 'mobile',
      testIgnore: /production\.spec\.ts/,
      use: { ...devices['Pixel 7'], baseURL: localURL },
    },
    {
      name: 'mobile-safari',
      testIgnore: /production\.spec\.ts/,
      use: { ...devices['iPhone 15'], baseURL: localURL },
    },
    // Read-only smoke checks against the live site and API.
    {
      name: 'production',
      testMatch: /production\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: productionURL },
    },
  ],
  webServer: process.env.SKIP_WEBSERVER
    ? undefined
    : {
        // Serves the existing ./build output; run `npm run build` first.
        command: 'npm run preview',
        url: localURL,
        reuseExistingServer: !isCI,
        timeout: 60_000,
      },
});
