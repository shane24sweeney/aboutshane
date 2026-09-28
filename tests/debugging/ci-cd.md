# Debugging CI/CD failures

## The workflows

| Workflow | Runs | Jobs |
|---|---|---|
| **CI** (`.github/workflows/ci.yml`) | Every push and pull request, or `gh workflow run ci.yml --ref <branch>` | Frontend (lint, types, unit tests, build) · Backend (Maven verify) · Infrastructure (cfn-lint) · End-to-end (Playwright, desktop + Android + iPhone) |
| **Production smoke** (`production-smoke.yml`) | Daily at 11:17 UTC, or by hand | smoke (`npm run test:smoke` on the live site) · Load (JMeter button clicks) |
| **BrowserStack mobile** (`browserstack.yml`) | By hand | Real devices; skipped while real-device tests are switched off |

The four CI jobs are required checks on `master`: a pull request can't merge until they pass.
Don't rename them, because the required checks match on the job names. Deploys are run by hand
(see [infra/README.md](../../infra/README.md)), not by a workflow.

## Find the failure

```bash
gh pr checks                        # this branch's PR: which checks failed
gh run list --limit 5               # recent runs
gh run view <run-id> --log-failed   # just the failed steps' logs
npm run debug:ci                    # download the latest failed run's reports and open them
npm run debug:ci -- <run-id>        # a specific run
```

On GitHub, a failed Playwright job shows its failures in four places:

1. **Annotations:** each failing test is listed on the run's summary page.
2. **Job summary:** a table of failures at the bottom of the run page.
3. **Job log:** the full error for each test.
4. **Artifacts:** `playwright-report` (CI) or `production-smoke-report` (daily), with the HTML
   report, traces, screenshots and `test-results/junit.xml`. `npm run debug:ci` downloads them into
   `tests/debugging/ci-artifacts/<run-id>/` and opens the report. The daily run also uploads
   `jmeter-report`.

## Reproduce it locally

CI runs on Ubuntu with `CI=1`, which turns on 2 retries, 2 workers and `forbidOnly`. Run the same
way:

```bash
npm ci && npm run build
CI=1 npx playwright test --project=mobile-safari -g "name of the failing test"
```

If it passes locally but fails in CI:

- **Linux WebKit and fonts differ from macOS.** Text can wrap differently, which changes sizes.
  Check the CI screenshot and trace rather than your local browser.
- **CI is slower.** Wait on what the user sees (`await expect(…).toBeVisible()`), not fixed
  sleeps.
- **Order and parallelism.** Try `--workers=2 --repeat-each 10` locally.

## Flaky tests

With 2 retries, a test that fails and then passes is reported as **flaky**, and the job still
passes. Look for flaky tests in the HTML report and fix them. Don't raise the retries.

## Rerun

```bash
gh run rerun <run-id> --failed                     # rerun only the failed jobs
gh workflow run production-smoke.yml --ref master   # start the daily run now
```

## When the daily production run fails

The daily run tests the live site, so a failure may be a real outage:

1. Open https://selenium-automation.com and check the pages and the contact form.
2. Rerun the job. If it passes, it was probably a slow first response: the backend (AWS Lambda)
   is slow to answer the first request after a deploy or a long idle period.
3. Look for `429` responses in the log or JMeter table. The API allows 2 requests per second, so
   extra load at the same time can push the tests over it.
4. The **Load** job only runs if **smoke** passed. Its results table is in the job summary; the
   full report is in the `jmeter-report` artifact.

## Workflow file changes

- Check YAML changes on a branch: push it and watch `gh pr checks`.
- Artifact paths must match where the tests write (for example `frontend/build` and
  `tests/jmeter/results`). A wrong path uploads nothing, with only a warning in the log.
