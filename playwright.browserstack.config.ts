import { defineConfig } from '@playwright/test';
import baseConfig, { productionSpecs } from './playwright.config';

// Used by `npm run test:browserstack`. browserstack.yml picks the devices, so this config has no
// projects. BrowserStack Local tunnels the preview server; bs-local.com resolves to this machine
// on the devices (iOS cannot reach "localhost" through the tunnel).

// Switched off until BrowserStack is set up; see docs/browserstack.md.
if (process.env.REAL_DEVICE_TESTS !== 'on') {
  throw new Error('Real-device tests are switched off. See docs/browserstack.md, then run with REAL_DEVICE_TESTS=on.');
}

export default defineConfig({
  ...baseConfig,
  testIgnore: productionSpecs,
  projects: undefined,
  // Real devices are slower and share a remote session, so run fewer at once.
  workers: 2,
  timeout: 60_000,
  use: { ...baseConfig.use, baseURL: 'http://bs-local.com:4173' },
});
