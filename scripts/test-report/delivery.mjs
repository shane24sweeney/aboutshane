// Delivery numbers for the quality report, from the GitHub API: pull requests merged, commits to
// master and how often CI passed, over the last 30 days, with merges per week.
//
//   GITHUB_TOKEN=... node scripts/test-report/delivery.mjs <owner/repo> <out.json>
//
// Works without a token for a public repo (GitHub then allows 60 requests an hour).

import { writeFileSync } from 'node:fs';

const [repo = process.env.GITHUB_REPOSITORY ?? 'shane24sweeney/aboutshane', out = 'reports/delivery.json'] = process.argv.slice(2);
const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
const days = 30;
const since = new Date(Date.now() - days * 86_400_000);
const sinceDate = since.toISOString().slice(0, 10);

async function get(path) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.json();
}

// Follows pages until a short one, up to `pages`.
async function all(path, pick, pages = 5) {
  const items = [];
  for (let page = 1; page <= pages; page += 1) {
    const batch = pick(await get(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`));
    items.push(...batch);
    if (batch.length < 100) break;
  }
  return items;
}

try {
  const [prs, commits, runs] = await Promise.all([
    all(`/search/issues?q=${encodeURIComponent(`repo:${repo} is:pr is:merged merged:>=${sinceDate}`)}`, (r) => r.items),
    all(`/repos/${repo}/commits?sha=master&since=${since.toISOString()}`, (r) => r),
    all(`/repos/${repo}/actions/workflows/ci.yml/runs?created=${encodeURIComponent(`>=${sinceDate}`)}`, (r) => r.workflow_runs),
  ]);
  const finished = runs.filter((run) => ['success', 'failure', 'timed_out'].includes(run.conclusion));
  // Merges per week, oldest first, the last bucket ending today.
  const weeks = Array.from({ length: Math.ceil(days / 7) }, (_, i) => {
    const end = new Date(Date.now() - (Math.ceil(days / 7) - 1 - i) * 7 * 86_400_000);
    const start = new Date(end.getTime() - 7 * 86_400_000);
    const merged = prs.filter((pr) => {
      const at = new Date(pr.pull_request?.merged_at ?? pr.closed_at);
      return at > start && at <= end;
    }).length;
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10), merged };
  });
  const delivery = {
    days,
    since: sinceDate,
    mergedPullRequests: prs.length,
    commits: commits.length,
    contributors: new Set(commits.map((c) => c.author?.login ?? c.commit.author?.name)).size,
    ciRuns: finished.length,
    ciPassed: finished.filter((run) => run.conclusion === 'success').length,
    weeks,
    recent: prs.slice(0, 5).map((pr) => ({ number: pr.number, title: pr.title, url: pr.html_url, merged: pr.pull_request?.merged_at ?? pr.closed_at })),
  };
  writeFileSync(out, JSON.stringify(delivery, null, 2));
  console.log(`Delivery: ${delivery.mergedPullRequests} PRs merged, ${delivery.commits} commits, CI ${delivery.ciPassed}/${delivery.ciRuns}`);
} catch (error) {
  // The report still builds without this section.
  console.warn(`Delivery numbers skipped: ${error.message}`);
}
