# Real-device testing: BrowserStack and Appium

**Status: prepared, not in use.** Everything below is set up in the repo but switched off. No
BrowserStack account is connected, and nothing here runs in CI. Every push is already tested on
emulated phones (see [Mobile testing](testing.md#4-mobile-tests-android-and-ios)). This guide is
for adding real phones later.

## The off switch

Until real-device testing is set up, it is blocked in three places, so it can't start by accident:

| Way in | What stops it |
|---|---|
| `npm run test:browserstack` | `scripts/require-real-devices.mjs` exits before BrowserStack is contacted |
| Calling `playwright.browserstack.config.ts` or `tests/appium/wdio.conf.ts` directly | Each config throws as soon as it loads |
| **BrowserStack mobile** GitHub workflow | Its job is skipped unless the repository variable `REAL_DEVICE_TESTS` is `on` |

All three check `REAL_DEVICE_TESTS=on`. To switch on, set it in your shell for local runs and as
a repository variable (**Settings → Secrets and variables → Actions → Variables**) for GitHub
Actions. Normal CI, `npm test` and `npm run test:e2e` never use BrowserStack or Appium.

## Why real devices

The emulated phones run in desktop Chromium and WebKit with a phone's screen size, touch input and
user agent. That catches layout and tap-size problems, but not bugs that only appear in the
phone's own browser: iOS Safari's zoom and keyboard behaviour, Android Chrome's address bar
resizing the page, or real-device rendering and performance.

## Two ways to run on real phones

| | Playwright on BrowserStack | Appium with WebdriverIO |
|---|---|---|
| Files | `browserstack.yml`, `playwright.browserstack.config.ts`, `.github/workflows/browserstack.yml` | `tests/appium/wdio.conf.ts`, `tests/appium/specs/` |
| Tests | The existing Playwright suite in `tests/e2e/`, unchanged | Separate WebdriverIO specs (starts with the phone-layout checks) |
| Runs on | BrowserStack real devices only | BrowserStack real devices, or a local Android emulator and iOS simulator |
| Packages | Already installed (`browserstack-node-sdk`) | Not installed yet (see [Switching on Appium](#switching-on-appium)) |
| Target | This commit's build, tunnelled with BrowserStack Local | The live site by default; any URL through `BASE_URL` |

Start with **Playwright on BrowserStack**: it reuses every existing test. Add **Appium** if your
BrowserStack plan doesn't support Playwright on iOS, or if you want to test on local emulators
without a BrowserStack account.

Both use the same four devices:

| Device | OS | Browser |
|---|---|---|
| Samsung Galaxy S23 | Android 13 | Chrome |
| Google Pixel 8 | Android 14 | Chrome |
| iPhone 15 | iOS 17 | Safari |
| iPhone 14 | iOS 16 | Safari |

Check each one is on your plan before the first run, on
[BrowserStack's device list](https://www.browserstack.com/list-of-browsers-and-platforms/playwright).
To change devices, edit `browserstack.yml` and `browserStackDevices` in `tests/appium/wdio.conf.ts`
together.

## Switching on BrowserStack

1. Create a BrowserStack Automate account and copy the username and access key from
   **Account → Settings**.
2. Add them as the repository secrets `BROWSERSTACK_USERNAME` and `BROWSERSTACK_ACCESS_KEY`
   (**Settings → Secrets and variables → Actions**). Never put them in a file in the repo.
3. Run it once locally:

   ```bash
   export BROWSERSTACK_USERNAME=... BROWSERSTACK_ACCESS_KEY=... REAL_DEVICE_TESTS=on
   npm run build
   npm run test:browserstack
   ```

   Results appear on the BrowserStack Automate dashboard under the build `aboutshane-mobile`.
4. Add the repository variable `REAL_DEVICE_TESTS` with the value `on`, then run it in GitHub
   Actions: **Actions → BrowserStack mobile → Run workflow**. It uploads the
   Playwright report as the `browserstack-report` artifact.
5. To run it automatically, add a `push` or `schedule` trigger to
   `.github/workflows/browserstack.yml`. Leave it out of the required checks on `master` until it
   has been reliable for a while; real devices are slower and flakier than emulators.

How it reaches the site: BrowserStack Local opens a tunnel from the devices to the preview server
on this machine. The tests use `http://bs-local.com:4173`, because iOS devices can't reach
`localhost` through the tunnel. The contact API is mocked, as in CI, so no email is sent.

## Switching on Appium

Appium drives the phone's real browser, Chrome on Android and Safari on iOS. WebdriverIO runs the
tests.

### 1. Install the packages

```bash
npm install --save-dev @wdio/cli @wdio/local-runner @wdio/mocha-framework @wdio/spec-reporter \
  @wdio/appium-service @wdio/browserstack-service appium
npx appium driver install uiautomator2   # Android
npx appium driver install xcuitest       # iOS (macOS only)
```

Then add a script to `package.json`:

```json
"test:appium": "node scripts/require-real-devices.mjs && wdio run tests/appium/wdio.conf.ts"
```

### 2. Run locally on an emulator and a simulator

- **Android:** install Android Studio, create an emulator (AVD) with Chrome, and set
  `ANDROID_AVD` to its name (default `Pixel_7_API_34`).
- **iOS:** install Xcode and an iOS simulator runtime. Set `IOS_SIMULATOR` and `IOS_VERSION` to
  match it (defaults `iPhone 15` and `17.5`).

```bash
REAL_DEVICE_TESTS=on npm run test:appium
```

The Appium service starts the Appium server itself, so there's nothing else to launch.

### 3. Run on BrowserStack real devices

```bash
export BROWSERSTACK_USERNAME=... BROWSERSTACK_ACCESS_KEY=... REAL_DEVICE_TESTS=on
APPIUM_TARGET=browserstack npm run test:appium
```

### What it tests and where

The checks are read-only, so by default they run against the live site,
`https://selenium-automation.com`. To test a local build, set `BASE_URL`:

| Where the phone is | `BASE_URL` |
|---|---|
| Android emulator | `http://10.0.2.2:4173` (the emulator's name for this machine) |
| iOS simulator | `http://localhost:4173` |
| BrowserStack, with BrowserStack Local | `http://bs-local.com:4173` (the tunnel starts automatically) |

`tests/appium/specs/phone-layout.e2e.ts` repeats the most device-sensitive checks from
`tests/e2e/mobile.spec.ts`:

- the nav fits on one row of buttons at least 44px square
- no page scrolls sideways
- the contact E-mail field brings up the email keyboard, and every field has text of at least 16px, so
  iOS Safari doesn't zoom the page on focus

The config and spec type-check against WebdriverIO 9. They haven't been run on a device yet.

## Cost and limits

- BrowserStack bills by parallel sessions. `parallelsPerPlatform: 1` in `browserstack.yml` and
  `maxInstances: 2` in the Appium config keep usage low.
- Running against the live site sends real requests to the content API, which is limited to 2
  requests per second. Keep real-device runs against the live site small, or test a local build.
