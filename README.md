# selenium-automation.com

[![CI](https://github.com/shane24sweeney/aboutshane/actions/workflows/ci.yml/badge.svg)](https://github.com/shane24sweeney/aboutshane/actions/workflows/ci.yml)
[![Production smoke](https://github.com/shane24sweeney/aboutshane/actions/workflows/production-smoke.yml/badge.svg)](https://github.com/shane24sweeney/aboutshane/actions/workflows/production-smoke.yml)

Portfolio site for Shane James Sweeney, Senior QE and Automation Consultant.
Live at **[selenium-automation.com](https://selenium-automation.com)**.

The site is small, but it is built and tested the way I build production systems: typed code,
infrastructure as code, automated tests at every layer, and a CI pipeline that gates every change.

## Architecture

```
Browser ──► CloudFront (selenium-automation.com, TLS, security headers)
              ├── /*      ──► S3 (React build)   CloudFront Function rewrites SPA routes to /index.html
              └── /api/*  ──► API Gateway HTTP API (rate limited) ──► Lambda (Spring Boot, SnapStart)
                                                                        ├── DynamoDB  (stores messages, 1-year TTL)
                                                                        └── SES       (emails a notification, DKIM-signed)
```

- **Frontend** (`src/`): React 18, TypeScript (strict), Vite, React Router 7, React Bootstrap.
  Pages are lazy-loaded; content lives in typed data files under `src/data/`.
- **Backend** (`backend/`): Spring Boot 3.5 on Java 21, run on Lambda through
  `aws-serverless-java-container`. `POST /api/contact` validates input, drops honeypot spam,
  stores the message, then emails it. A failed email never loses a message.
- **Infrastructure** (`infra/template.yaml`): one AWS SAM stack for everything above, including
  the SES identities and their DKIM DNS records. The site and API share one origin, so there is
  no CORS configuration.

## Testing

| Layer | Tooling | What it covers |
|---|---|---|
| Unit / component | Vitest, Testing Library | Routing, one `h1` per page, alt text, nav labels, contact form states, resume rendering |
| API | JUnit 5, MockMvc, Mockito | Validation, error mapping, honeypot, storage and notification order, full Spring context wiring |
| End-to-end | Playwright (desktop, 2 Android and 3 iPhone profiles) | Navigation, deep links, console errors, resume accordion, contact form with mocked API |
| Mobile | Playwright emulation; real-device setup for BrowserStack prepared, not yet in use | One-row nav with 44px tap targets, tapping every nav button, no sideways scroll, contact keyboards and no zoom-on-focus, resume taps |
| Accessibility | axe-core via Playwright | WCAG 2.1 A/AA, no serious or critical violations on any page |
| Production smoke | Playwright (desktop, Pixel 7, iPhone 15), Postman | Live pages, phone layouts, security headers, API health, validation and 404 handling (read-only) |
| Load | JMeter | The request behind every button: page load, each nav link's content API, contact Send (invalid, sends nothing). `e2e/production-buttons.spec.ts` is the Playwright twin: real clicks on the live site, same checks |
| Infrastructure | cfn-lint | SAM/CloudFormation template |

### How TypeScript and Playwright work together

The site and its end-to-end tests are both written in strict TypeScript. `tsc` only type-checks
(`noEmit`), so a wrong type fails the build before any browser starts. Vite compiles the site, and
Playwright compiles the specs itself when it runs them.

```mermaid
flowchart LR
  subgraph code["TypeScript source"]
    app["src/**/*.tsx<br/>the website"]
    specs["e2e/*.spec.ts<br/>the tests"]
    config["playwright.config.ts<br/>projects: device + target URL"]
  end

  code --> tsc{{"tsc -b<br/>strict type check"}}
  app --> vite["vite build<br/>to ./build"]
  vite --> preview["npm run preview<br/>localhost:4173"]

  specs & config --> runner["Playwright test runner<br/>compiles specs on the fly"]
  runner -- "starts (webServer)" --> preview
  runner --> browsers["Chromium and WebKit<br/>one run per project"]
  fixtures["e2e/fixtures.ts<br/>answers /api/content/* from content/*.json"] -. "mocks the API" .-> browsers
  browsers -- "load pages" --> preview
  browsers --> reports["HTML report, JUnit XML,<br/>GitHub job summary"]
```

### Mobile testing (Android and iOS)

Every Playwright spec runs on an Android phone and an iPhone as well as desktop, and
`e2e/mobile.spec.ts` adds phone-only checks. Each check skips itself on screens wider than a phone.

```mermaid
flowchart TD
  specs["Every e2e spec<br/>+ e2e/mobile.spec.ts phone-layout checks"]

  specs --> ci["CI: every push and pull request<br/>local build, mocked API"]
  ci --> android["Android on Chromium<br/>Pixel 7 · Galaxy S24"]
  ci --> ios["iPhone on WebKit<br/>iPhone 15 · iPhone SE · iPhone 15 Pro Max"]

  specs --> daily["Daily production smoke<br/>selenium-automation.com"]
  daily --> live["Pixel 7 · iPhone 15<br/>page and phone-layout checks only"]

  specs -.-> bs["BrowserStack real devices<br/>prepared, not yet in use"]
  bs -.-> real["Galaxy S23 · Pixel 8 on Chrome<br/>iPhone 15 · iPhone 14 on Safari"]
```

| | Android | iOS |
|---|---|---|
| Emulated in CI, on every push and PR | On Chromium: `mobile` (Pixel 7, 412px wide), `mobile-small` (Galaxy S24, 360px) | On WebKit, the engine behind Safari: `mobile-safari` (iPhone 15, 393px), `mobile-safari-small` (iPhone SE, 375px), `mobile-safari-large` (iPhone 15 Pro Max, 430px) |
| Live site, daily smoke run | `production-mobile`: Pixel 7 | `production-mobile-safari`: iPhone 15 |
| Real devices (BrowserStack, prepared, not yet in use) | Samsung Galaxy S23 (Android 13), Google Pixel 8 (Android 14), Chrome | iPhone 15 (iOS 17), iPhone 14 (iOS 16), Safari |

The emulated projects use each phone's screen size, pixel density, touch input and user agent.
They run in the desktop builds of Chromium and WebKit, so they catch layout and touch problems,
not bugs that only appear in the phone's own browser. The BrowserStack setup is there to cover
those once it is switched on.

The phone-only checks (`phone layout` in `e2e/mobile.spec.ts`):

- The nav fits on one row of icon buttons, each at least 44px, the minimum tap size in Apple's guidelines.
- Tapping each nav button opens its page.
- No page scrolls sideways.
- Home page buttons are large enough to tap.
- The contact form's E-mail field brings up the email keyboard, Name and E-mail offer autofill,
  and no field zooms the page on focus (font size of at least 16px, which stops iOS Safari from zooming).
- Resume roles expand with a tap and stay on screen.

On the live site the phone projects run only the page checks and the phone-layout checks. The
API-only smoke tests stay on desktop, so the API's limit of 2 requests per second isn't hit three
times over.

How to run them:

```bash
npm run build && npm run test:mobile                    # all five emulated phones
npx playwright test --project='mobile-safari*'          # iPhones only
npm run test:smoke                                      # live site on desktop and both phones
BROWSERSTACK_USERNAME=... BROWSERSTACK_ACCESS_KEY=... npm run test:browserstack   # real devices: switched off, see docs/browserstack.md
```

Real-device testing is prepared but switched off. There are two routes: the Playwright suite on
BrowserStack, and an Appium config (`appium/`) that drives the phone's own Chrome or Safari,
locally or on BrowserStack. [docs/browserstack.md](docs/browserstack.md) explains both and how to
switch them on.

CI (`.github/workflows/ci.yml`) runs all of it on every push and pull request and publishes the
Playwright HTML report as a build artifact. A daily workflow runs the smoke suite against production,
then the JMeter button-click load test, and publishes its HTML report.

### How the JMeter load test works

`jmeter/button-clicks.jmx` sends the request behind every button on the live site, as a few
visitors clicking through it at once. The defaults keep it under the API's limit of 2 requests per
second. Change them with JMeter properties, for example
`jmeter -n -t jmeter/button-clicks.jmx -Jusers=5 -Jloops=10`; more users can hit that limit.

```mermaid
flowchart LR
  start["Daily workflow, after the smoke job passes<br/>or npm run test:load"] --> plan

  subgraph plan["button-clicks.jmx: 3 visitors, 10 s ramp-up, 3 loops, 1.5 to 2.5 s between clicks"]
    direction TB
    home["GET /home<br/>serves the app shell"] --> nav["GET /api/content/*<br/>profile, about, resume, testimonials,<br/>education, charity: valid JSON"]
    nav --> contact["POST /api/contact with an invalid form<br/>rejected with 400, nothing sent"]
  end

  plan -- "every request and its result" --> jtl["results.jtl"]
  jtl --> check{"check-results.py<br/>any failed sample?"}
  check -- yes --> fail["Job fails"]
  check -- no --> pass["Job passes"]
  jtl --> report["HTML report and job-summary table<br/>(median and max ms per button)"]
```

`e2e/production-buttons.spec.ts` runs the same checks with Playwright, clicking the real buttons
in a browser.

## Running locally

Requirements: Node 20+, Java 21, Maven, and the AWS SAM CLI for deployment.

```bash
npm ci
npm run dev          # http://localhost:3000; /api is proxied to localhost:8080
npm run lint && npm run typecheck && npm test

npm run build
npm run test:e2e     # Playwright desktop + Android + iPhone against the production build
npm run test:mobile  # just the emulated Android and iPhone projects
npm run test:browserstack  # real devices from browserstack.yml; needs BROWSERSTACK_USERNAME/ACCESS_KEY
npm run test:smoke   # read-only checks against selenium-automation.com, desktop + phones
npm run test:load    # JMeter button-click load test (brew install jmeter); report in jmeter/results/report

cd backend && mvn verify
```

## Deploying

See [infra/README.md](infra/README.md).
