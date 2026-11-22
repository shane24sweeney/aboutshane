# Security

## Reporting a vulnerability

Please report security problems privately, not in a public issue: use **Report a vulnerability** on
this repository's [Security tab](https://github.com/shane24sweeney/aboutshane/security). You'll get a
reply within a few days, and a fix is released as soon as it's ready.

## How the repository is protected

- **Only the owner can change it.** There are no other collaborators, deploy keys or webhooks.
  Anyone can fork it, but a fork can't change this repository.
- **`master` takes changes only through pull requests**, and only when the four CI checks pass.
  The rule applies to the owner too, and force-pushes and branch deletion are blocked.
- **Outside contributors' pull requests run CI only after the owner approves them**, and workflows
  never run with secrets for pull requests from forks (no `pull_request_target`).
- **Workflows are read-only by default** and can't approve pull requests. Only GitHub's own actions,
  verified publishers and `aws-actions/configure-aws-credentials` may run.
- **AWS access has no stored keys:** GitHub signs in with OIDC, and the role trusts only workflows
  on `master` in this repository. It can only send the report email and read API timings.
- **GitHub Pages deploys only from `master`.**
- **Secret scanning with push protection** blocks keys and passwords from being pushed;
  **Dependabot** alerts on and fixes vulnerable dependencies; **CodeQL** scans the code.

## How the site is protected

- HTTPS only (HSTS), a strict Content-Security-Policy, a Permissions-Policy, no framing by other
  sites, and no cookies except Google Analytics' (with consent where required). See
  `frontend/security-headers.ts` and `SiteSecurityHeaders` in `infra/template.yaml`.
- The contact API validates every field, drops spam, and is rate-limited; other websites can't call it.
- Security tests (`@security`) run on every pull request and every day against the live site:
  see the Security tests section of [tests/README.md](tests/README.md).
