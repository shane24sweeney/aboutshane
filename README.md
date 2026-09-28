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

- **Frontend** (`frontend/`): React 18, TypeScript (strict), Vite, React Router 7, React Bootstrap.
  Pages are lazy-loaded. Page text comes from the content API, with the same `content/*.json`
  bundled as a fallback.
- **Backend** (`backend/`): Spring Boot 3.5 on Java 21, run on Lambda through
  `aws-serverless-java-container`. `POST /api/contact` validates input, drops honeypot spam,
  stores the message, then emails it. A failed email never loses a message.
- **Infrastructure** (`infra/template.yaml`): one AWS SAM stack for everything above, including
  the SES identities and their DKIM DNS records. The site and API share one origin, so there is
  no CORS configuration.

## Repository layout

```
frontend/         The website: React + TypeScript
  src/            Pages, components, hooks, styles, images
  public/         Static files copied into the build (icons, manifest, robots.txt)
  index.html
  vite.config.ts  Dev server and build; output goes to frontend/build
backend/          The API: Spring Boot on Java 21
  src/main/       Contact and content API
  src/test/       API tests (JUnit), kept here because Maven expects them here
content/          Page text as JSON, shared by the frontend, backend and tests
tests/            Every other test, one folder per type
  unit/           Vitest + Testing Library, testing frontend/src
  e2e/            Playwright: end-to-end, mobile, accessibility, production smoke
  load/           JMeter load test and its pass/fail check
  api/            Postman collection for the live API
  appium/         Real-device tests with Appium (switched off)
infra/            AWS SAM template and deploy script
scripts/          One-off tools (social preview image, real-device off switch)
docs/             Testing and BrowserStack guides
```

Tool configs stay at the root, where their tools look for them: `package.json`, `tsconfig*.json`,
`eslint.config.js`, `vitest.config.ts`, `playwright.config.ts`, `playwright.browserstack.config.ts`
and `browserstack.yml`.

## Testing

Every push and pull request runs the unit, API, end-to-end, mobile, accessibility and
infrastructure tests, and a pull request can't merge until they pass. A daily run checks the live
site. **[docs/testing.md](docs/testing.md)** covers each type of test in its own section, with
diagrams and commands.

| Type | Tool | Runs |
|---|---|---|
| Unit and component | Vitest, Testing Library | Every push and PR |
| API | JUnit 5, MockMvc, Mockito | Every push and PR |
| End-to-end | Playwright, TypeScript | Every push and PR |
| Mobile | Playwright: 2 Android and 3 iPhone emulations | Every push and PR; daily on the live site |
| Accessibility | axe-core (WCAG 2.1 A/AA) | Every push and PR |
| Production smoke | Playwright, Postman | Daily |
| Load | JMeter | Daily, after the smoke tests |
| Infrastructure | cfn-lint | Every push and PR |
| Real devices | BrowserStack, Appium | Switched off; see [docs/browserstack.md](docs/browserstack.md) |

## Running locally

Requirements: Node 20+, Java 21, Maven, and the AWS SAM CLI for deployment.

```bash
npm ci
npm run dev          # http://localhost:3000; /api is proxied to localhost:8080
npm run lint && npm run typecheck && npm test
npm run build

cd backend && mvn verify
```

Commands for every other type of test are in [docs/testing.md](docs/testing.md).

## Deploying

See [infra/README.md](infra/README.md).
