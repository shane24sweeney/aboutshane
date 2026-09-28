# Debugging mobile tests

Every spec also runs on five emulated phones, and `tests/e2e/mobile.spec.ts` adds phone-only
checks:

| Project | Phone | Browser engine | Width |
|---|---|---|---|
| `mobile` | Pixel 7 | Chromium | 412px |
| `mobile-small` | Galaxy S24 | Chromium | 360px |
| `mobile-safari` | iPhone 15 | WebKit | 393px |
| `mobile-safari-small` | iPhone SE (3rd gen) | WebKit | 375px |
| `mobile-safari-large` | iPhone 15 Pro Max | WebKit | 430px |

Emulation sets the screen size, pixel density, touch input and user agent. It runs in the desktop
builds of Chromium and WebKit, not the phone's own browser.

## Run one phone

```bash
npm run build
npm run debug:mobile                                        # UI mode, all five phones
npx playwright test --project=mobile-safari-small --headed  # watch the iPhone SE
npx playwright test --project=mobile-small --debug -g "does not scroll sideways"
npx playwright test --project='mobile-safari*'              # every iPhone
```

`--headed` opens a window at the phone's size, so you can see the layout it tested.

## Is it the phone, the engine or the screen size?

When a test fails on some phones but not others, compare:

| Fails on | Points to |
|---|---|
| Every phone, not desktop | A phone layout rule (the breakpoint is 600px, in `Navigation.css`) |
| Only the iPhones | WebKit behaviour: Safari's zoom on inputs under 16px, flex or `position: sticky` differences |
| Only the Android phones | Chromium behaviour |
| Only the smallest phones (Galaxy S24, iPhone SE) | Something too wide for 360–375px: long words, fixed widths, big images |

Run one test across every phone to see the pattern:

```bash
npx playwright test -g "nav fits on one row" --project='mobile*'
```

## Phone-only checks

The tests in `mobile.spec.ts` skip themselves on screens wider than 600px, so they show as
skipped on desktop. That's expected. The home carousel test is skipped on phones for the same
reason: the home page stacks its sections on phones instead of using a carousel.

| Check fails | Look at |
|---|---|
| Tap targets under 44px | The element's size in the trace's DOM snapshot; padding in the page's CSS |
| Nav on more than one row | Too many or too-wide nav buttons for the smallest phone |
| Sideways scroll | An element wider than the screen; in `--headed`, scroll right to find it |
| Zoom on focus | An input's font size under 16px (iOS Safari zooms) |

## Try it by hand in a phone browser

To see a bug in the phone's real browser, use the free simulators:

- **iPhone:** install Xcode, open **Simulator**, and in Safari visit `http://localhost:4173`
  (run `npm run preview` first). Inspect it from your Mac's Safari: **Develop → Simulator → the
  page**. Turn on the Develop menu in Safari's settings, under **Advanced**.
- **Android:** in Android Studio, start an emulator and visit `http://10.0.2.2:4173` in Chrome
  (`10.0.2.2` is the emulator's name for your computer). Inspect it from desktop Chrome at
  `chrome://inspect`.

Real-device test runs (BrowserStack, Appium) are prepared but switched off; see
[../../docs/browserstack.md](../../docs/browserstack.md).

## On the live site

The daily run checks the live site on a Pixel 7 and an iPhone 15:

```bash
SKIP_WEBSERVER=1 npx playwright test --project=production-mobile-safari --headed
```
