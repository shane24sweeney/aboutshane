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
| End-to-end | Playwright (desktop, Pixel 7, iPhone 15) | Navigation, deep links, console errors, resume accordion, contact form with mocked API |
| Mobile | Playwright emulation; real devices via BrowserStack (manual workflow) | One-row nav with 44px tap targets, tapping every nav button, no sideways scroll, contact keyboards and no zoom-on-focus, resume taps |
| Accessibility | axe-core via Playwright | WCAG 2.1 A/AA, no serious or critical violations on any page |
| Production smoke | Playwright (desktop, Pixel 7, iPhone 15), Postman | Live pages, phone layouts, security headers, API health, validation and 404 handling (read-only) |
| Load | JMeter | The request behind every button: page load, each nav link's content API, contact Send (invalid, sends nothing). `e2e/production-buttons.spec.ts` is the Playwright twin: real clicks on the live site, same checks |
| Infrastructure | cfn-lint | SAM/CloudFormation template |

CI (`.github/workflows/ci.yml`) runs all of it on every push and pull request and publishes the
Playwright HTML report as a build artifact. A daily workflow runs the smoke suite against production,
then the JMeter button-click load test, and publishes its HTML report.

## Running locally

Requirements: Node 20+, Java 21, Maven, and the AWS SAM CLI for deployment.

```bash
npm ci
npm run dev          # http://localhost:3000; /api is proxied to localhost:8080
npm run lint && npm run typecheck && npm test

npm run build
npm run test:e2e     # Playwright desktop + Android + iPhone against the production build
npm run test:mobile  # just the emulated Pixel 7 and iPhone 15 projects
npm run test:browserstack  # real devices from browserstack.yml; needs BROWSERSTACK_USERNAME/ACCESS_KEY
npm run test:smoke   # read-only checks against selenium-automation.com, desktop + phones
npm run test:load    # JMeter button-click load test (brew install jmeter); report in jmeter/results/report

cd backend && mvn verify
```

## Deploying

See [infra/README.md](infra/README.md).
