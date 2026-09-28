// Stops real-device test runs (BrowserStack, Appium) until they are switched on on purpose.
// Runs before anything connects to BrowserStack or starts Appium. See docs/browserstack.md.

if (process.env.REAL_DEVICE_TESTS !== 'on') {
  console.error(
    'Real-device tests (BrowserStack, Appium) are switched off and not set up yet.\n' +
      'See docs/browserstack.md, then run with REAL_DEVICE_TESTS=on.',
  );
  process.exit(1);
}
