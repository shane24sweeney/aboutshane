# JMeter load tests

`button-clicks.jmx` sends the request behind every button on selenium-automation.com, as a few
visitors clicking through the site at once. `check-results.py` decides pass or fail, because JMeter
itself exits 0 even when a request fails.

Each simulated visitor, on every loop:

1. Opens the site: `GET /home`, plus the scripts, styles and images the page loads (these appear
   in the results as `/home-0`, `/home-1` and so on).
2. Clicks every nav button: `GET /api/content/{profile,about,resume,testimonials,education,charity}`.
   Each response must be valid JSON with the expected content.
3. Clicks Send on an invalid contact form: `POST /api/contact` must be rejected with 400. No
   message is stored and no email is sent.

Between clicks it waits 1.5 to 2.5 seconds, like a person would.

## Install

JMeter needs Java 17 or later. On macOS:

```bash
brew install jmeter
jmeter --version     # CI uses 5.6.3
```

On Linux, download the binary from [jmeter.apache.org](https://jmeter.apache.org/download_jmeter.cgi)
and add its `bin/` folder to your `PATH`.

## Run it

From the repo root, the npm script clears old results, runs the test and checks them:

```bash
npm run test:load
```

The same thing with the JMeter CLI directly:

```bash
rm -rf tests/jmeter/results && mkdir -p tests/jmeter/results
jmeter -n \
  -t tests/jmeter/button-clicks.jmx \
  -l tests/jmeter/results/results.jtl \
  -e -o tests/jmeter/results/report
python3 tests/jmeter/check-results.py
```

| Flag | Meaning |
|---|---|
| `-n` | Non-GUI mode. Always use it for real runs; the GUI slows JMeter down and skews timings |
| `-t <file>` | The test plan to run |
| `-l <file>` | Where to write every request and its result (a CSV `.jtl` file) |
| `-e -o <folder>` | Build the HTML dashboard into this folder when the run ends. The folder must be empty or not exist |
| `-J<name>=<value>` | Set a property the plan reads (see below) |
| `-j <file>` | Where to write JMeter's own log (default `jmeter.log` in the current folder) |

## Change the load or the target

The plan reads these properties. Set any of them with `-J`:

| Property | Default | What it controls |
|---|---|---|
| `users` | `3` | Visitors clicking at the same time |
| `rampUp` | `10` | Seconds to start all the visitors |
| `loops` | `3` | Times each visitor clicks through the site |
| `thinkTime` | `1500` | Minimum pause between clicks in ms; up to 1000 ms is added at random |
| `protocol` | `https` | `http` or `https` |
| `host` | `selenium-automation.com` | The site to test |
| `port` | *(empty)* | Leave empty for the protocol's default port |

```bash
# More visitors for longer
jmeter -n -t tests/jmeter/button-clicks.jmx -l tests/jmeter/results/results.jtl -Jusers=5 -Jloops=10

# Another deployment of the site, e.g. the CloudFront URL
jmeter -n -t tests/jmeter/button-clicks.jmx -l tests/jmeter/results/results.jtl \
  -Jhost=d2qs8nltlyt1de.cloudfront.net
```

**Mind the API's rate limit.** The live API allows 2 requests per second (bursts of 10). The
defaults stay under it. Many more users, or a much shorter `thinkTime`, will get `429 Too Many
Requests` responses, and those count as failures.

## Read the results

- **Terminal:** `check-results.py` prints a table of requests, failures, and median and max time
  per button, then exits 1 if anything failed, listing each failure.
- **HTML dashboard:** `open tests/jmeter/results/report/index.html` shows response times over
  time, percentiles, throughput and errors.
- **Raw data:** `tests/jmeter/results/results.jtl`, one CSV row per request.
- **JMeter's log:** `jmeter.log` in the folder you ran from. Look here if the run fails before any
  requests are sent.

`tests/jmeter/results/` and `jmeter.log` are ignored by git.

## Edit the test plan

Open it in the JMeter GUI to add or change requests and assertions:

```bash
jmeter -t tests/jmeter/button-clicks.jmx
```

Save it, then run it from the CLI as above. Don't run load from the GUI. When you add a button to
the site, add its request here and its twin to `tests/e2e/production-buttons.spec.ts`, which clicks
the same buttons in a real browser.

## In CI

The daily **Production smoke** workflow (`.github/workflows/production-smoke.yml`) runs
`npm run test:load` after the Playwright smoke tests pass. It uploads `tests/jmeter/results` and
`jmeter.log` as the `jmeter-report` artifact and adds the results table to the job summary.

## Troubleshooting

| Problem | Fix |
|---|---|
| `Cannot write to '…/report' as folder is not empty` | Delete `tests/jmeter/results` first (`npm run test:load` does this for you) |
| `jmeter: command not found` | Install JMeter, or add its `bin/` folder to your `PATH` |
| Every request fails with a connection error | Check `host`, `protocol` and `port`, and that the site is up |
| `429` failures | Too much load for the rate limit; lower `users` or raise `thinkTime` |
| `No samples recorded` from `check-results.py` | JMeter didn't send anything; check `jmeter.log` |
