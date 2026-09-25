# selenium-automation.com

[![CI](https://github.com/shane24sweeney/aboutshane/actions/workflows/ci.yml/badge.svg)](https://github.com/shane24sweeney/aboutshane/actions/workflows/ci.yml)
[![Production smoke](https://github.com/shane24sweeney/aboutshane/actions/workflows/production-smoke.yml/badge.svg)](https://github.com/shane24sweeney/aboutshane/actions/workflows/production-smoke.yml)

Portfolio site for Shane James Sweeney, Senior QE Lead and Test Automation Architect.
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
| End-to-end | Playwright (desktop + mobile) | Navigation, deep links, console errors, resume accordion, contact form with mocked API |
| Accessibility | axe-core via Playwright | WCAG 2.1 A/AA, no serious or critical violations on any page |
| Production smoke | Playwright, Postman | Live pages, security headers, API health, validation and 404 handling (read-only) |
| Infrastructure | cfn-lint | SAM/CloudFormation template |

CI (`.github/workflows/ci.yml`) runs all of it on every push and pull request and publishes the
Playwright HTML report as a build artifact. A daily workflow runs the smoke suite against production.

## Running locally

Requirements: Node 20+, Java 21, Maven, and the AWS SAM CLI for deployment.

```bash
npm ci
npm run dev          # http://localhost:3000; /api is proxied to localhost:8080
npm run lint && npm run typecheck && npm test

npm run build
npm run test:e2e     # Playwright desktop + mobile against the production build
npm run test:smoke   # read-only checks against selenium-automation.com

cd backend && mvn verify
```

## Deploying

See [infra/README.md](infra/README.md).
