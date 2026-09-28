# Debugging mobile tests

Every spec also runs on five emulated phones, and `tests/e2e/regression/mobile.spec.ts` adds phone-only
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

## Inspect elements on iOS and Android

To see an element's id, classes, attributes, size or the locator a test should use, open the site
as a phone. Pick the tool by what you need:

| Command | Browser | Shows | Needs |
|---|---|---|---|
| `npm run inspect:ios` | Emulated iPhone 15 (Playwright WebKit) | Locators, with the Playwright Inspector | Nothing extra |
| `npm run inspect:android` | Emulated Pixel 7 (Playwright Chromium) | Locators, with the Playwright Inspector | Nothing extra |
| Safari Responsive Design Mode | Safari on your Mac, at iPhone sizes | Full Web Inspector: DOM, ids, CSS, console, network | Nothing extra |
| Chrome device mode | Chrome on your Mac, at Android and iPhone sizes | Full DevTools: DOM, ids, CSS, console, network | Nothing extra |
| `npm run inspect:ios:simulator` | Real Safari in the iOS Simulator | Full Web Inspector on real iOS Safari | Xcode |
| `npm run inspect:android:emulator` | Real Chrome in the Android emulator | Full DevTools on real Android Chrome | Android Studio |

Every command opens the local build (`npm run build` first; the script starts the preview server
if needed). Add `-- --live` for the live site and a path for another page:

```bash
npm run inspect:ios -- /contact
npm run inspect:android -- --live /resume
IOS_DEVICE="iPhone SE (3rd gen)" npm run inspect:ios      # another emulated phone
ANDROID_DEVICE="Galaxy S24" npm run inspect:android
```

### Playwright Inspector (`inspect:ios`, `inspect:android`)

A phone-sized browser opens next to the Playwright Inspector.

1. Click **Pick locator**, then hover or click an element on the page.
2. The Inspector shows the locator a test would use, such as `getByLabel('E-mail')` or
   `locator('#contact-email')`. Edit it in the box to highlight what it matches.
3. Click around the site: the Inspector records each action as test code you can copy into a spec.

Playwright suggests role and label locators first, as the tests do. To see raw ids and every
attribute, use one of the full inspectors below.

### Safari Responsive Design Mode (iPhone sizes, no Xcode)

1. In Safari, turn on **Settings → Advanced → Show features for web developers**.
2. Open `http://localhost:4173/home` (`npm run preview`) or the live site.
3. **Develop → Enter Responsive Design Mode**, then pick an iPhone at the top.
4. Right-click an element → **Inspect Element** to see its id, classes, attributes and CSS.

This is Safari's real WebKit engine at the phone's size, but not iOS itself.

### Chrome device mode (Android and iPhone sizes)

1. In Chrome, open the page and press **Cmd+Option+I** for DevTools.
2. Press **Cmd+Shift+M** for the device toolbar and pick a phone, such as Pixel 7.
3. Use the element picker (**Cmd+Shift+C**) and click an element to see it in the Elements panel.

### Real iOS Safari (`inspect:ios:simulator`)

Needs Xcode from the App Store; open it once, then run
`sudo xcode-select -s /Applications/Xcode.app`. The script boots the simulator (`IOS_SIMULATOR`,
default iPhone 15) and opens the page in Safari. The simulator reaches your Mac as `localhost`.

To inspect: in your Mac's Safari, **Develop → Simulator → the page**. The Web Inspector connects
to Safari inside the simulator.

### Real Android Chrome (`inspect:android:emulator`)

Needs Android Studio: create a phone in **Device Manager** with a Google Play or Google APIs
image. The script starts it (`ANDROID_AVD`, default the first one), forwards port 4173 so the
emulator's `localhost:4173` reaches your Mac, and opens the page in Chrome.

To inspect: open `chrome://inspect/#devices` in desktop Chrome and click **inspect** under the
page.

### Useful selectors on this site

| Element | Selector | In tests |
|---|---|---|
| Main nav | `nav[aria-label="Primary navigation"]` | `getByRole('navigation', { name: 'Primary navigation' })` |
| Nav buttons | `.nav-button` (each has `aria-label`, e.g. `Resume`) | `getByRole('link', { name: 'Resume' })` |
| Nav text, hidden on phones | `.nav-label` | |
| Contact fields | `#contact-name`, `#contact-email`, `#contact-message` | `getByLabel('Name')`, `getByLabel('E-mail')`, `getByLabel('Message')` |
| Spam trap, hidden | `#contact-website` | |
| Page heading | `h1` | `getByRole('heading', { level: 1 })` |

## On the live site

The daily run checks the live site on a Pixel 7 and an iPhone 15:

```bash
SKIP_WEBSERVER=1 npx playwright test --project=production-mobile-safari --headed
```
