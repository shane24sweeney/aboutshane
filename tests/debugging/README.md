# Debugging tests

How to find out why a test failed, one guide per place it can fail:

| Guide | Use it when |
|---|---|
| [desktop.md](desktop.md) | A desktop Playwright test fails on your machine, or you're writing a new one |
| [mobile.md](mobile.md) | A test fails on an emulated Android phone or iPhone, or a layout looks wrong on phones |
| [ci-cd.md](ci-cd.md) | A GitHub Actions check fails on a push or pull request, or the daily production run fails |

## Shortcuts

Run these from the repo root after `npm ci` and `npm run build`:

| Command | What it does |
|---|---|
| `npm run debug:desktop` | Opens Playwright's UI mode with the desktop tests: pick a test, watch it run, step through each action |
| `npm run debug:mobile` | The same for the five emulated phones |
| `npm run debug:ci` | Downloads the reports from the latest failed GitHub Actions run on this branch and opens them ([ci-report.sh](ci-report.sh)) |
| `npx playwright show-report` | Opens the HTML report from your last local run |
| `npx playwright test --last-failed` | Reruns only the tests that failed last time |

## What every failed Playwright test leaves behind

`playwright.config.ts` keeps evidence for every failure, locally and in CI:

- **Trace:** a recording of every action, network request, console message and DOM snapshot.
  Open it with `npx playwright show-trace <path>/trace.zip`, or from the HTML report.
- **Screenshot:** the page at the moment it failed.
- **HTML report:** in `playwright-report/`; in CI, the `playwright-report` artifact.
- **Result files:** traces and screenshots per test in `test-results/`.

A trace is usually the fastest way to see what went wrong. It shows the page before and after
every step.

## Other test types

- **Unit tests (Vitest):** `npm run test:watch` reruns on save. Add
  `-- tests/unit/Contact.test.tsx -t "name of test"` to run one test, and call `screen.debug()` in
  a test to print the rendered HTML.
- **API tests (JUnit):** `cd backend && mvn test -Dtest=ContactControllerTest` runs one class.
  Reports are in `backend/target/surefire-reports/`.
- **Load tests (JMeter):** see [../jmeter/README.md](../jmeter/README.md#troubleshooting).
