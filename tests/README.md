# Tests

Every command for running the tests, on your machine and in GitHub Actions. What each type of
test covers is in [docs/testing.md](../docs/testing.md); how to debug a failure is in
[debugging/](debugging/README.md).

| Folder | What's in it |
|---|---|
| [unit/](unit/) | Vitest + Testing Library: components, hooks and content, testing `frontend/src` |
| [e2e/regression/](e2e/regression/) | Playwright regression suite: the whole site against the local build, on desktop and five emulated phones |
| [e2e/smoke/](e2e/smoke/) | Playwright smoke suite: quick read-only checks of the live site |
| [e2e/support/](e2e/support/) | Shared Playwright code: content fixtures, the page list, the CI job-summary reporter |
| [jmeter/](jmeter/README.md) | JMeter load test of the live site |
| [api/](api/) | Postman collection for the live API |
| [appium/](appium/) | Real-device tests with Appium (switched off; see [docs/browserstack.md](../docs/browserstack.md)) |
| [debugging/](debugging/README.md) | Guides and scripts for debugging failures and inspecting the site on phones |

The API tests (JUnit) are in `backend/src/test/`, where Maven expects them.

## Set up once

```bash
npm ci                                   # dependencies
npx playwright install chromium webkit   # browsers for Playwright (Chrome/Android and Safari/iPhone)
brew install jmeter                      # only for the load test
```

Run everything from the repo root. Build the site before the regression tests, and again after
changing it:

```bash
npm run build
```

## Run locally

### Smoke and regression (Playwright)

| Command | Runs |
|---|---|
| `npm run test:regression` | Regression: desktop and all five phones, against the local build (444 tests) |
| `npm run test:regression:desktop` | Regression on desktop Chrome only |
| `npm run test:mobile` | Regression on the five emulated phones |
| `npm run test:mobile:android` | Regression on the Pixel 7 and Galaxy S24 (Chromium) |
| `npm run test:mobile:ios` | Regression on the iPhone 15, iPhone SE and iPhone 15 Pro Max (WebKit) |
| `npm run test:smoke` | Smoke: read-only checks of the live site, desktop plus Pixel 7 and iPhone 15 (66 tests; no build needed) |
| `npm run test:e2e` | Regression, then smoke |

Narrow any of them down by adding arguments after `--`:

```bash
npm run test:regression -- tests/e2e/regression/contact.spec.ts       # one file
npm run test:regression -- tests/e2e/regression/contact.spec.ts:33    # the test on one line
npm run test:regression -- -g "sends the message"                     # tests whose name matches
npm run test:mobile:ios -- --headed                                   # watch the browser
npm run test:regression -- --last-failed                              # only last run's failures
npx playwright test --project=mobile-safari-small                     # one phone
npx playwright show-report                                            # the last run's HTML report
```

### Other tests

| Command | Runs |
|---|---|
| `npm test` | Unit and component tests (Vitest) |
| `npm run test:watch` | Unit tests, rerunning on save |
| `cd backend && mvn verify` | API tests (JUnit) and the backend build |
| `npm run test:api` | Postman collection against the live API, run with Newman (read-only) |
| `npm run test:load` | JMeter load test of the live site ([details](jmeter/README.md)) |
| `npm run lint && npm run typecheck` | ESLint and the TypeScript type check |
| `cfn-lint infra/template.yaml` | The AWS template (`pip install cfn-lint`) |

### Negative tests

Tests that feed the site bad input, failing APIs or wrong requests, and check it fails safely,
are tagged `negative` in every layer. They still run with their suites; these commands run only
them:

| Command | Runs |
|---|---|
| `npm run test:negative` | Negative unit tests, then negative regression tests on desktop and all five phones |
| `npm run test:negative:api` | Negative API tests (JUnit `@Tag("negative")`) |
| `npm run test:negative:smoke` | Negative checks against the live API (read-only) |
| `npm run test:regression -- --grep-invert @negative` | Regression without the negative tests |

What they cover is listed in [docs/testing.md](../docs/testing.md#negative-tests).

### Analytics (Google Analytics)

The **Analytics** tab (`/analytics`) shows, from Google Analytics, who visits the site and from
where (the US or abroad) on a 3D globe, beside how fast the site is: real visitors' Core Web
Vitals, the API's response times and the load test. Everything is free.

- **Tracking** (`frontend/src/analytics/analytics.ts`): GA4 (`G-6E90ERR71Y`) with Consent Mode.
  Visitors in the EEA, UK and Switzerland are asked first (`ConsentBanner`), anyone can change their
  choice from **Cookie settings** in the footer, and advertising features are always off. Nothing
  loads for automated browsers (tests never count as visits), local copies of the site, or browsers
  sending Global Privacy Control or Do Not Track. Page views go per route; Core Web Vitals go as events.
- **Export** (`scripts/analytics/export.mjs`, in the daily workflow): the last 30 days from the GA4
  Data API (property `565419707`) as the read-only `ga-reader` service account, plus the API's
  p50/p90/p99 from CloudWatch and the load test, published as `visitors.json`; `GET /api/visitors`
  serves it. Needs the `GA_SERVICE_ACCOUNT` secret and the `API_ID` variable; until then the page
  says the numbers are coming.

### Security tests

Tagged `@security`. They run with the regression and smoke suites, and on their own with:

```bash
npm run test:security          # local injection tests on desktop + phones, then the live checks
npm run test:security:smoke    # only the live checks (read-only)
```

- **Live site** (`tests/e2e/smoke/production-security.spec.ts`): every page sends HSTS for a year,
  `nosniff`, same-origin framing and a strict referrer policy, sets no cookies and names no server
  versions; HTTP redirects to HTTPS on both domains; `.env`, `.git`, `package.json`, `pom.xml` and the
  template are refused; no source maps, AWS keys, private keys or GitHub tokens in the JavaScript;
  nothing loads over plain HTTP; new-tab links can't reach back (`noopener`/`noreferrer`) and none
  use `javascript:`; other websites can't read the API or post to the contact form (CORS); the API
  refuses TRACE and its errors name no framework or stack trace. Nothing is submitted.
- **Content-Security-Policy** (`frontend/security-headers.ts`, sent by CloudFront's
  `SiteSecurityHeaders` and by the local preview, so every Playwright test runs under it): scripts
  only from the site and Google Analytics, no inline code or eval, connections only to the site,
  the daily report and Google Analytics, no plugins or outside framing, plus a Permissions-Policy
  turning off camera, microphone, location and payments. `csp.spec.ts` checks every page (and the
  3D views, map and search) breaks no rule, and that injected inline script, event handlers,
  outside scripts and data sent to an outside server are all blocked; the live smoke checks the
  header and runs the same no-violation check; `tests/unit/securityHeaders.test.ts` checks the
  template and the preview use the identical policy and what Google Analytics may do.
- **Cross-site scripting** (`tests/e2e/regression/security.spec.ts`, local, APIs mocked): script and
  HTML payloads in content-API text (home, testimonials, resume, charity), race names in the map's
  popups, contact-form fields and the API's error answers, and the address bar are all shown as
  plain text and never run.

### Everything CI checks on a pull request

```bash
npm run lint && npm run typecheck && npm test && npm run build && npm run test:regression
(cd backend && mvn verify)
cfn-lint infra/template.yaml
```

## Run in CI/CD (GitHub Actions)

These use the GitHub CLI (`gh`), signed in to the repo.

| Workflow | Runs automatically | Start it by hand |
|---|---|---|
| **CI**: lint, types, unit, API, build, regression, cfn-lint | Every push and pull request | `gh workflow run ci.yml --ref <branch>` |
| **Daily tests and report**: UI and API tests with coverage, regression, live smoke and JMeter, then a quality report and an email | Daily at 11:17 UTC, and after every merge to master (no email) | `gh workflow run production-smoke.yml --ref master` |
| **BrowserStack mobile**: real devices | Never (switched off) | Skipped until `REAL_DEVICE_TESTS` is on ([details](../docs/browserstack.md)) |

### The daily report

Each morning a quality report for the whole project goes to a public dashboard at
**[shane24sweeney.github.io/aboutshane](https://shane24sweeney.github.io/aboutshane/)**, written so
it can be read without opening any test output:

- **Verdict:** Healthy, Needs attention or Incomplete, with a plain-English summary and a donut of
  every check.
- **Headline numbers:** pass rate, checks run, code coverage, devices covered, typical response time
  under load, and how many of the last 30 days were fully green.
- **Development:** donuts for the UI unit tests (Vitest) and API tests (JUnit), and line and branch
  coverage for each (Vitest coverage and JaCoCo).
- **Quality assurance:** donuts for regression, the live site and the load test; coverage by device;
  speed per button under load.
- **Delivery:** pull requests merged, commits and the CI pass rate over 30 days, with merges per week.
- **Every test in 3D** (`3d.html`): one bar per test file and device, stacked by result. Drag to
  turn it and select a bar to list its tests. A table view has the same numbers.
- Links to the full Playwright, JMeter and coverage reports.

The same numbers are published as `metrics.json` next to the dashboard. The site's **Metrics**
tab (`/metrics`, `frontend/src/pages/Metrics.tsx`) reads it straight from GitHub Pages, so it shows
the latest run without a redeploy: the verdict, headline numbers, donuts for development and QA,
the 3D chart (select a bar, or a cell in its table view, to list the bar's tests), device coverage,
speed under load, delivery and the 30-day trend. Tests serve `tests/e2e/support/metrics.sample.json`
in its place.

A summary email with the same verdict, numbers and donut charts (as an attached image, since email
apps don't draw charts) goes to the contact address. The scripts are in `scripts/test-report/`:
`build.mjs` builds the dashboard and email, `charts.mjs` draws the charts, `development.mjs` reads
the unit-test and coverage results, `delivery.mjs` asks GitHub for the delivery numbers, and
`send-email.mjs` wraps the email for SES. It's all free: GitHub Pages and Actions cost nothing for a
public repo, and one SES email a day is a fraction of a cent a month.

### Code coverage

UI coverage counts the unit tests **and** the browser tests, because the 3D views, the race map and
the phone layout only really run in a browser:

```bash
npm run coverage:all        # everything below, in order; open coverage-combined/index.html
npm run build:coverage      # a build instrumented for coverage (COVERAGE=1); never deployed
npm run test:coverage:browser   # the regression tests on it (desktop, Pixel 7, iPhone 15) -> coverage-browser/
npm run test:coverage       # the unit tests -> coverage/
npm run coverage:merge      # adds them up -> coverage-combined/, and checks the minimums
```

The minimums live in `scripts/coverage/thresholds.json`: 100% of lines for the navigation, footer,
app shell and every page, and at least 95% of lines and 90% of branches for the UI overall. The CI
job "UI coverage (unit + browser)" fails below them. `infra/deploy-frontend.sh` refuses to upload an
instrumented build.

`mvn verify` in `backend/` writes the API's coverage to `backend/target/site/jacoco/index.html`, and
fails (so the required Backend check fails) below 95% of lines or 90% of branches.

One-time setup (already done for this repo):

1. Deploy the stack (`infra/template.yaml` adds `ReportEmailRole`, which can only send email from
   the site's domain to the contact address; GitHub signs in with OIDC, so no AWS keys are stored).
2. `gh api repos/shane24sweeney/aboutshane/pages -X POST -f build_type=workflow` turns on Pages.
3. `gh variable set REPORT_ROLE_ARN --body <ReportEmailRoleArn stack output>`
4. `gh secret set REPORT_EMAIL` and paste the address, which stays out of the public repo.
5. While SES is in the sandbox, the address must be verified (the link in Amazon's email).

Until steps 3 and 4 are done the email job is skipped; the dashboard still publishes.

To try the report locally after running the suites, copy each run's `playwright-report` and
`test-results` into `reports/regression` and `reports/smoke`, `tests/jmeter/results` into
`reports/jmeter/tests/jmeter/results`, `test-results/unit.json` and `coverage` from
`npm run test:coverage` into `reports/ui`, and `backend/target/surefire-reports` and
`backend/target/site/jacoco` into `reports/api/surefire-reports` and `reports/api/site/jacoco`. Then:

```bash
node scripts/test-report/delivery.mjs shane24sweeney/aboutshane reports/delivery.json
node scripts/test-report/build.mjs reports site   # open site/index.html, site/3d.html, reports/email.html
```

Follow and manage runs:

```bash
gh pr checks --watch                   # this branch's pull request checks, live
gh run list --limit 5                  # recent runs
gh run watch <run-id>                  # follow a run
gh run view <run-id> --log-failed      # the failed steps' logs
gh run rerun <run-id> --failed         # rerun only the failed jobs
npm run debug:ci                       # download the latest failed run's reports and open them
```

In CI the regression job runs `npm run test:regression` and the smoke job runs `npm run test:smoke`,
the same commands as above, with `CI=1` (2 retries, 2 workers). To reproduce a CI run locally,
prefix the command with `CI=1`.

## Writing tests: Given, When, Then

Every test except the unit tests is written as Given (the starting state), When (what the visitor
or client does) and Then (what should happen), with And for extra checks.

- **Playwright** (`e2e/`): use the steps in [e2e/support/steps.ts](e2e/support/steps.ts). Each
  one is a named step, so the HTML report, the trace viewer and CI logs show the test as a
  readable scenario, and a failure points at the step it happened in:

  ```ts
  await given('the contact API is rate limiting (429)', () => page.route('**/api/contact', (route) => route.fulfill({ status: 429 })));
  await when('the visitor submits a message', () => submit.click());
  await then('they are asked to try again later', () => expect(page.getByRole('alert')).toContainText('Too many messages'));
  ```

  A Given shared by every test in a file goes in its `beforeEach`.
- **JUnit** (`backend/src/test/`) and **Appium** (`appium/`): mark each part with a comment,
  `// given …`, `// when …`, `// then …`.
- **Unit tests** (`unit/`) keep the usual arrange, act, assert layout.

## Debug and inspect

| Command | Opens |
|---|---|
| `npm run debug:desktop` | Playwright UI mode with the desktop tests |
| `npm run debug:mobile` | Playwright UI mode with the five phones |
| `npm run inspect:ios` | The site as an iPhone 15 (WebKit) with the Playwright Inspector: pick elements, see ids and locators |
| `npm run inspect:android` | The same as a Pixel 7 (Chromium) |
| `npm run inspect:ios:simulator` | Safari in the iOS Simulator, to inspect with Safari's Web Inspector (needs Xcode) |
| `npm run inspect:android:emulator` | Chrome in the Android emulator, to inspect at `chrome://inspect` (needs Android Studio) |

Add `-- --live` to inspect selenium-automation.com instead of the local build, and a path to open
another page: `npm run inspect:ios -- --live /contact`. See
[debugging/mobile.md](debugging/mobile.md#inspect-elements-on-ios-and-android).
