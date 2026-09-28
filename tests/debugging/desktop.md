# Debugging desktop tests

The `desktop` Playwright project runs every spec in `tests/e2e/` in Desktop Chrome, against the
production build served on `http://localhost:4173`. The content API is answered from
`content/*.json` by `tests/e2e/fixtures.ts`, and the contact API is mocked in each test.

## Before you start

```bash
npm ci
npx playwright install chromium webkit   # once, and after upgrading Playwright
npm run build                            # the tests run against frontend/build
```

Rebuild after changing the site. Playwright starts `npm run preview` itself, or reuses one that's
already running. If a test sees old code, stop the old preview server and rebuild.

## Pick the right tool

| You want to | Run |
|---|---|
| Browse the tests, run one, and step through it with DOM snapshots | `npm run debug:desktop` (UI mode) |
| Watch the browser while the tests run | `npx playwright test --project=desktop --headed` |
| Pause before every action and step through in the Inspector | `npx playwright test --project=desktop --debug tests/e2e/contact.spec.ts` |
| Run one test by name | `npx playwright test --project=desktop -g "sends the message"` |
| Run the test on one line | `npx playwright test --project=desktop tests/e2e/contact.spec.ts:33` |
| Rerun only what failed | `npx playwright test --last-failed` |
| Check whether a test is flaky | `npx playwright test --project=desktop -g "name" --repeat-each 20` |
| Record a trace even when it passes | `npx playwright test --project=desktop -g "name" --trace on` |
| Open the last report | `npx playwright show-report` |

To stop at an exact point, add `await page.pause();` in the test and run it with `--headed`. The
Inspector opens there. Remove it before committing; `forbidOnly` catches a stray `test.only` in CI,
but not a `page.pause()`.

## Read a failure

1. **The error:** the terminal shows the failing line and the expected and received values.
2. **The screenshot and trace:** `npx playwright show-report`, then open the test. In the trace,
   click each action to see the page before and after it, the network requests and the console.
3. **Locators:** in UI mode or the Inspector, use **Pick locator** to see how Playwright finds an
   element. Prefer `getByRole` and `getByLabel`, as the existing specs do.

## Common causes

| Symptom | Likely cause |
|---|---|
| Every test fails at `page.goto` | No build: run `npm run build`. Or port 4173 is taken by something else |
| The test sees old text or layout | The build is out of date; rebuild |
| `pages load without console errors` fails | A real console error on that page; the trace's Console tab shows it |
| An accessibility test fails | axe lists each violation with the element and a help link; fix the markup, not the test |
| A content test fails after editing `content/*.json` | The fixtures serve the same JSON, so update the test's expected text |

## Test the live site from your machine

The production projects run read-only checks against selenium-automation.com. Point them
elsewhere with `PRODUCTION_URL`:

```bash
SKIP_WEBSERVER=1 npx playwright test --project=production --headed
SKIP_WEBSERVER=1 PRODUCTION_URL=https://d2qs8nltlyt1de.cloudfront.net npx playwright test --project=production
```

`SKIP_WEBSERVER=1` stops Playwright starting the local preview server, which these tests don't
need, so they also run without a build.
