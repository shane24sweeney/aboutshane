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
| `npm run test:regression` | Regression: desktop and all five phones, against the local build (312 tests) |
| `npm run test:regression:desktop` | Regression on desktop Chrome only |
| `npm run test:mobile` | Regression on the five emulated phones |
| `npm run test:mobile:android` | Regression on the Pixel 7 and Galaxy S24 (Chromium) |
| `npm run test:mobile:ios` | Regression on the iPhone 15, iPhone SE and iPhone 15 Pro Max (WebKit) |
| `npm run test:smoke` | Smoke: read-only checks of the live site, desktop plus Pixel 7 and iPhone 15 (64 tests; no build needed) |
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
| `npm run test:load` | JMeter load test of the live site ([details](jmeter/README.md)) |
| `npm run lint && npm run typecheck` | ESLint and the TypeScript type check |
| `cfn-lint infra/template.yaml` | The AWS template (`pip install cfn-lint`) |

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
| **Production smoke**: smoke tests, then the JMeter load test | Daily at 11:17 UTC | `gh workflow run production-smoke.yml --ref master` |
| **BrowserStack mobile**: real devices | Never (switched off) | Skipped until `REAL_DEVICE_TESTS` is on ([details](../docs/browserstack.md)) |

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
