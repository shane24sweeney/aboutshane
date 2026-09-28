// Future Appium setup: WebdriverIO drives the phone's own browser (Chrome on Android, Safari on iOS)
// through Appium. Not wired into npm scripts or CI yet, and its packages are not installed; see
// docs/browserstack.md for how to switch it on.
//
//   REAL_DEVICE_TESTS=on npx wdio run tests/appium/wdio.conf.ts                              # local emulator and simulator
//   REAL_DEVICE_TESTS=on APPIUM_TARGET=browserstack npx wdio run tests/appium/wdio.conf.ts   # BrowserStack real devices

// Switched off until Appium is installed and set up.
if (process.env.REAL_DEVICE_TESTS !== 'on') {
  throw new Error('Real-device tests are switched off. See docs/browserstack.md, then run with REAL_DEVICE_TESTS=on.');
}

const onBrowserStack = process.env.APPIUM_TARGET === 'browserstack';

/**
 * The checks are read-only, so they run against the live site by default. For a local build, set
 * BASE_URL: http://bs-local.com:4173 through BrowserStack Local, or http://10.0.2.2:4173 from the
 * Android emulator (its alias for this machine; the iOS simulator can use localhost).
 */
const baseUrl = process.env.BASE_URL ?? 'https://selenium-automation.com';

/** Same devices as browserstack.yml. */
const browserStackDevices = [
  { deviceName: 'Samsung Galaxy S23', osVersion: '13.0', platformName: 'android', browserName: 'chrome' },
  { deviceName: 'Google Pixel 8', osVersion: '14.0', platformName: 'android', browserName: 'chrome' },
  { deviceName: 'iPhone 15', osVersion: '17', platformName: 'ios', browserName: 'safari' },
  { deviceName: 'iPhone 14', osVersion: '16', platformName: 'ios', browserName: 'safari' },
];

/** An Android emulator and an iOS simulator on this machine. Match the names to your own. */
const localCapabilities: WebdriverIO.Capabilities[] = [
  {
    platformName: 'Android',
    browserName: 'Chrome',
    'appium:automationName': 'UiAutomator2',
    'appium:avd': process.env.ANDROID_AVD ?? 'Pixel_7_API_34',
    // UiAutomator2 option missing from WebdriverIO's capability types; pairs with allowInsecure below.
    ...{ 'appium:chromedriverAutodownload': true },
  },
  {
    platformName: 'iOS',
    browserName: 'Safari',
    'appium:automationName': 'XCUITest',
    'appium:deviceName': process.env.IOS_SIMULATOR ?? 'iPhone 15',
    'appium:platformVersion': process.env.IOS_VERSION ?? '17.5',
  },
];

const browserStackCapabilities: WebdriverIO.Capabilities[] = browserStackDevices.map(
  ({ deviceName, osVersion, platformName, browserName }) => ({
    platformName,
    browserName,
    'bstack:options': {
      deviceName,
      osVersion,
      realMobile: true,
      deviceOrientation: 'portrait',
      projectName: 'AboutShane',
      buildName: process.env.BROWSERSTACK_BUILD_NAME ?? 'aboutshane-appium',
      consoleLogs: 'errors',
      networkLogs: true,
    },
  }),
);

export const config: WebdriverIO.Config = {
  runner: 'local',
  specs: ['./specs/**/*.e2e.ts'],
  baseUrl,
  maxInstances: onBrowserStack ? 2 : 1,
  capabilities: onBrowserStack ? browserStackCapabilities : localCapabilities,

  // Credentials come from the environment (GitHub secrets in CI); never commit them.
  ...(onBrowserStack
    ? {
        user: process.env.BROWSERSTACK_USERNAME,
        key: process.env.BROWSERSTACK_ACCESS_KEY,
        hostname: 'hub.browserstack.com',
        services: [['browserstack', { browserstackLocal: baseUrl.includes('bs-local.com') }]],
      }
    : {
        // Lets UiAutomator2 fetch the Chromedriver that matches the emulator's Chrome.
        services: [['appium', { args: { allowInsecure: 'uiautomator2:chromedriver_autodownload' } }]],
      }),

  framework: 'mocha',
  mochaOpts: { timeout: 120_000 },
  reporters: ['spec'],
  logLevel: 'warn',
  // Real devices and first emulator boots are slow.
  waitforTimeout: 15_000,
  connectionRetryTimeout: 180_000,
  connectionRetryCount: 2,
};
