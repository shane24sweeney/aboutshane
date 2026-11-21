// Builds the daily quality report for the whole project: development (UI and API tests, code
// coverage, delivery) and quality assurance (regression, live site, load), as an executive
// dashboard on GitHub Pages, a 3D view of every test, and an HTML email with the same summary.
//
//   node scripts/test-report/build.mjs <inputs> <site>
//
// <inputs> holds the downloaded workflow artifacts:
//   ui/          test-results/unit.json and coverage/ (Vitest)
//   api/         surefire-reports/ and site/jacoco/ (Maven, from backend/target)
//   delivery.json  from delivery.mjs
//   regression/  playwright-report/ and test-results/results.json (desktop and the 5 phones)
//   smoke/       the same, from the live site
//   jmeter/      tests/jmeter/results/results.jtl and report/
// <site> gets index.html, 3d.html, history.json and each full report.
// <inputs> gets email.html, email-subject.txt and email-chart.png (see send-email.mjs).
// Missing inputs (a job that didn't finish) show as "no results" and mark the day incomplete.

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { donutRow, gridPage, overviewStyles, renderEmailChart, summary as donutSummary } from './charts.mjs';
import { readApi, readDelivery, readUi } from './development.mjs';

const [inputs = 'reports', site = 'site'] = process.argv.slice(2);
const siteURL = process.env.REPORT_SITE_URL ?? 'https://shane24sweeney.github.io/aboutshane/';
const runURL = process.env.GITHUB_RUN_ID
  ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
  : '';

// Each Playwright project: the device it emulates, which suite it belongs to, and a short name for the 3D grid.
const projects = {
  desktop: { device: 'Desktop (Chrome)', suite: 'regression', short: 'Desktop' },
  mobile: { device: 'Android · Pixel 7', suite: 'regression', short: 'Pixel 7' },
  'mobile-small': { device: 'Android · Galaxy S24', suite: 'regression', short: 'Galaxy S24' },
  'mobile-safari': { device: 'iPhone 15', suite: 'regression', short: 'iPhone 15' },
  'mobile-safari-small': { device: 'iPhone SE', suite: 'regression', short: 'iPhone SE' },
  'mobile-safari-large': { device: 'iPhone 15 Pro Max', suite: 'regression', short: '15 Pro Max' },
  production: { device: 'Desktop (Chrome)', suite: 'smoke', short: 'Live desktop' },
  'production-mobile': { device: 'Android · Pixel 7', suite: 'smoke', short: 'Live Pixel 7' },
  'production-mobile-safari': { device: 'iPhone 15', suite: 'smoke', short: 'Live iPhone 15' },
};
const deviceName = (project) => projects[project]?.device ?? project;
const deviceOrder = [...new Set(Object.values(projects).map((p) => p.device))];

// Test files in words.
const areaNames = {
  about: 'About page', accessibility: 'Accessibility', carousel: 'Photo carousels', contact: 'Contact form',
  'content-api': 'Content API', content: 'Page content', mobile: 'Phone layout', navigation: 'Navigation',
  pages: 'Every page', prerender: 'Pre-rendered pages', running: 'Running and race map',
  production: 'Live site', 'production-api': 'Live API', 'production-buttons': 'Live buttons',
};
const areaName = (file) => {
  const base = basename(file).replace(/\.spec\.ts$/, '');
  return areaNames[base] ?? base.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
};

const escape = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// Playwright error messages carry terminal colour codes.
const plain = (text = '') => text.replace(/\u001b\[[0-9;]*m/g, '');
// The first line of an error, plus Expected/Received when it's an assertion.
const summarise = (error) => {
  const lines = plain(error).split('\n').map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return 'No error message';
  return [lines[0], ...lines.filter((line) => /^(Expected|Received)/.test(line))].slice(0, 3).join('\n');
};
const duration = (ms) => (ms >= 60_000 ? `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s` : `${Math.round(ms / 1000)}s`);
const plural = (n, word) => `${n.toLocaleString('en-US')} ${word}${n === 1 ? '' : 's'}`;
const percent = (part, whole) => {
  if (!whole) return '–';
  const value = (part / whole) * 100;
  return `${value === 100 ? '100' : value >= 99.95 ? '99.9' : value.toFixed(1)}%`;
};

// ---- Playwright --------------------------------------------------------------------------

function readPlaywright(dir) {
  const file = join(inputs, dir, 'test-results', 'results.json');
  if (!existsSync(file)) return null;
  const json = JSON.parse(readFileSync(file, 'utf8'));
  const devices = new Map();
  const cells = new Map(); // "<file>|<project>" -> counts and test names, for the 3D grid
  const failures = [];
  const walk = (suite, path) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests) {
        const outcome = { expected: 'passed', unexpected: 'failed', flaky: 'flaky', skipped: 'skipped' }[test.status];
        const device = devices.get(test.projectName) ?? { passed: 0, failed: 0, flaky: 0, skipped: 0 };
        devices.set(test.projectName, device);
        device[outcome] += 1;
        const key = `${spec.file}|${test.projectName}`;
        const cell = cells.get(key) ?? { file: spec.file, project: test.projectName, passed: 0, failed: 0, flaky: 0, skipped: 0, tests: [] };
        cells.set(key, cell);
        cell[outcome] += 1;
        cell.tests.push({ t: [...path.slice(1), spec.title].filter(Boolean).join(' › '), s: outcome });
        if (outcome === 'failed') {
          const error = test.results.map((r) => r.error?.message).find(Boolean);
          failures.push({
            title: [...path.slice(1), spec.title].filter(Boolean).join(' › '),
            area: areaName(spec.file),
            file: `${spec.file}:${spec.line}`,
            device: deviceName(test.projectName),
            error: summarise(error),
          });
        }
      }
    }
    for (const child of suite.suites ?? []) walk(child, [...path, child.title]);
  };
  for (const suite of json.suites) walk(suite, [suite.title]);
  const totals = { passed: json.stats.expected, failed: json.stats.unexpected, flaky: json.stats.flaky, skipped: json.stats.skipped };
  const total = Object.values(totals).reduce((a, b) => a + b, 0);
  return { totals, total, devices, cells, failures, duration: json.stats.duration };
}

// ---- JMeter --------------------------------------------------------------------------------

// Splits one CSV line, honouring quoted fields (failure messages can contain commas).
function csvRow(line) {
  const cells = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (quoted && c === '"' && line[i + 1] === '"') { cell += '"'; i += 1; }
    else if (c === '"') quoted = !quoted;
    else if (c === ',' && !quoted) { cells.push(cell); cell = ''; }
    else cell += c;
  }
  cells.push(cell);
  return cells;
}

const median = (sorted) => sorted[Math.floor(sorted.length / 2)];
const p95 = (sorted) => sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)];

function readJMeter() {
  const file = join(inputs, 'jmeter', 'tests', 'jmeter', 'results', 'results.jtl');
  if (!existsSync(file)) return null;
  const [header, ...lines] = readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);
  const columns = csvRow(header);
  const labels = new Map();
  let first = Infinity;
  let last = 0;
  for (const line of lines) {
    const row = Object.fromEntries(csvRow(line).map((value, i) => [columns[i], value]));
    const label = labels.get(row.label) ?? { samples: 0, failed: 0, elapsed: [], errors: new Set() };
    labels.set(row.label, label);
    label.samples += 1;
    label.elapsed.push(Number(row.elapsed));
    if (row.success !== 'true') {
      label.failed += 1;
      label.errors.add(`${row.responseCode} ${row.failureMessage || row.responseMessage}`.trim());
    }
    first = Math.min(first, Number(row.timeStamp));
    last = Math.max(last, Number(row.timeStamp) + Number(row.elapsed));
  }
  const rows = [...labels].map(([name, label]) => {
    const sorted = label.elapsed.sort((a, b) => a - b);
    // "Open site - GET /home-0" is a file the page loads; its time is part of "Open site - GET /home".
    const part = /-\d+$/.test(name);
    const [action, request = ''] = name.split(' - ');
    return { name, action, request, part, samples: label.samples, failed: label.failed, median: median(sorted), p95: p95(sorted), max: sorted.at(-1), errors: [...label.errors] };
  });
  const actions = rows.filter((r) => !r.part);
  const elapsed = [...labels].filter(([name]) => !/-\d+$/.test(name)).flatMap(([, l]) => l.elapsed).sort((a, b) => a - b);
  return {
    rows,
    actions,
    samples: rows.reduce((n, r) => n + r.samples, 0),
    failed: rows.reduce((n, r) => n + r.failed, 0),
    median: elapsed.length ? median(elapsed) : null,
    p95: elapsed.length ? p95(elapsed) : null,
    duration: lines.length ? last - first : 0,
  };
}

// ---- Gather --------------------------------------------------------------------------------

const ui = readUi(join(inputs, 'ui'));
const api = readApi(join(inputs, 'api'));
const delivery = readDelivery(join(inputs, 'delivery.json'));
const regression = readPlaywright('regression');
const smoke = readPlaywright('smoke');
const jmeter = readJMeter();
const playwrightRuns = [regression, smoke].filter(Boolean);
const devRuns = [ui, api].filter(Boolean);
const testRuns = [...devRuns, ...playwrightRuns];

const missing = [
  ...(ui ? [] : ['UI unit tests']), ...(api ? [] : ['API tests']),
  ...(regression ? [] : ['regression']), ...(smoke ? [] : ['live smoke']), ...(jmeter ? [] : ['load']),
];
const failureCount = testRuns.reduce((n, d) => n + d.totals.failed, 0);
const flakyCount = playwrightRuns.reduce((n, d) => n + d.totals.flaky, 0);
const testCount = testRuns.reduce((n, d) => n + d.total, 0);
const ranCount = testRuns.reduce((n, d) => n + d.total - d.totals.skipped, 0);
const passedCount = testRuns.reduce((n, d) => n + d.totals.passed + (d.totals.flaky ?? 0), 0);
const devFailures = devRuns.flatMap((d) => d.failures.map((f) => ({ ...f, device: 'Build', file: '' })));
// Coverage across UI and API, weighted by lines.
const covered = devRuns.filter((d) => d.coverage);
const coverageLines = covered.reduce((n, d) => n + d.coverage.linesTotal, 0);
const coveragePct = coverageLines ? (covered.reduce((n, d) => n + d.coverage.linesCovered, 0) / coverageLines) * 100 : null;
const loadFailed = jmeter?.failed ?? 0;
const checks = ranCount + (jmeter?.samples ?? 0);
const checksPassed = passedCount + (jmeter ? jmeter.samples - jmeter.failed : 0);
const allPassed = !missing.length && failureCount === 0 && loadFailed === 0 && (jmeter?.samples ?? 0) > 0;
const status = allPassed ? 'healthy' : failureCount || loadFailed ? 'attention' : 'incomplete';
const statusText = { healthy: 'Healthy', attention: 'Needs attention', incomplete: 'Incomplete' }[status];

const devicesCovered = new Set(playwrightRuns.flatMap((d) => [...d.devices.keys()].map(deviceName))).size;
const failedDevices = [...new Set(playwrightRuns.flatMap((d) => d.failures.map((f) => f.device)))];
const failedAreas = [...new Set([...devFailures, ...playwrightRuns.flatMap((d) => d.failures)].map((f) => f.area))];

const now = new Date();
const today = now.toISOString().slice(0, 10);
const day = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Chicago' });
const shortDay = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Chicago' });

// The headline and the paragraph under it, written for someone who won't open the details.
let headline;
if (allPassed) headline = `All ${plural(checks, 'check')} passed`;
else {
  const parts = [];
  if (failureCount) parts.push(`${plural(failureCount, 'test')} failed`);
  if (loadFailed) parts.push(`${plural(loadFailed, 'load request')} failed`);
  if (missing.length) parts.push(`no results from ${missing.join(' and ')}`);
  headline = parts.join(', ').replace(/^./, (c) => c.toUpperCase());
}
const sentences = [];
if (devRuns.length) {
  const devRan = devRuns.reduce((n, d) => n + d.total - d.totals.skipped, 0);
  const devPassed = devRuns.reduce((n, d) => n + d.totals.passed, 0);
  sentences.push(`Development: ${devPassed} of ${devRan} UI and API tests passed${coveragePct != null ? `, covering ${Math.round(coveragePct)}% of the code` : ''}.`);
}
if (playwrightRuns.length) {
  const qaRan = playwrightRuns.reduce((n, d) => n + d.total - d.totals.skipped, 0);
  const qaPassed = playwrightRuns.reduce((n, d) => n + d.totals.passed + d.totals.flaky, 0);
  sentences.push(`Quality assurance: ${qaPassed} of ${qaRan} end-to-end tests passed on ${plural(devicesCovered, 'device')}, covering desktop, Android and iPhone.`);
}
if (jmeter) {
  sentences.push(
    jmeter.failed
      ? `Under load, ${plural(jmeter.failed, 'request')} of ${jmeter.samples} failed; the typical response took ${jmeter.median} ms.`
      : `Under load, the live site answered all ${jmeter.samples} requests, typically in ${jmeter.median} ms.`,
  );
}
if (failureCount) sentences.push(`The failures are in ${failedAreas.join(', ')}${failedDevices.length ? ` on ${failedDevices.join(', ')}` : ''}, listed below.`);
if (missing.length) sentences.push(`The ${missing.join(' and ')} run${missing.length === 1 ? '' : 's'} didn't finish, so ${missing.length === 1 ? 'its' : 'their'} results are missing today.`);
if (flakyCount) sentences.push(`${plural(flakyCount, 'test')} passed only on a retry and ${flakyCount === 1 ? 'is' : 'are'} worth watching.`);
if (delivery) sentences.push(`In the last ${delivery.days} days the team merged ${plural(delivery.mergedPullRequests, 'pull request')}, and CI passed ${percent(delivery.ciPassed, delivery.ciRuns)} of the time.`);
if (allPassed && !flakyCount) sentences.push('No action is needed.');
const summary = sentences.join(' ');

// History: yesterday's site holds the earlier days. Keep 30.
let history = [];
try {
  const response = await fetch(new URL('history.json', siteURL), { signal: AbortSignal.timeout(10_000) });
  if (response.ok) history = await response.json();
} catch {
  // First run, or Pages is down: start a new history.
}
history = [
  ...history.filter((entry) => entry.date !== today),
  { date: today, passed: allPassed, status, tests: testCount, checks, checksPassed, failed: failureCount, loadFailed: jmeter?.failed ?? null, median: jmeter?.median ?? null, coverage: coveragePct, run: runURL },
].slice(-30);
const greenDays = history.filter((h) => h.passed).length;

// ---- Dashboard -----------------------------------------------------------------------------

const kpis = [
  { label: 'Pass rate', value: percent(checksPassed, checks), sub: `${checksPassed.toLocaleString('en-US')} of ${checks.toLocaleString('en-US')} checks`, tone: allPassed ? 'good' : status === 'attention' ? 'bad' : '' },
  { label: 'Checks run', value: checks.toLocaleString('en-US'), sub: `${ranCount.toLocaleString('en-US')} tests · ${jmeter?.samples ?? 0} load requests` },
  { label: 'Code coverage', value: coveragePct != null ? `${Math.round(coveragePct)}%` : '–', sub: covered.length ? `of ${coverageLines.toLocaleString('en-US')} lines, UI and API` : 'No coverage results' },
  { label: 'Devices covered', value: String(devicesCovered), sub: 'Desktop, Android, iPhone' },
  { label: 'Typical response', value: jmeter?.median != null ? `${jmeter.median} ms` : '–', sub: jmeter?.p95 != null ? `95% within ${jmeter.p95} ms` : 'No load results' },
  { label: '30-day stability', value: `${greenDays}/${history.length}`, sub: `day${history.length === 1 ? '' : 's'} fully green` },
];
const kpiRow = `<div class="kpis">${kpis
  .map((k) => `<div class="kpi"><div class="kpi-label">${k.label}</div><div class="kpi-value ${k.tone ?? ''}">${escape(k.value)}</div><div class="kpi-sub">${escape(k.sub)}</div></div>`)
  .join('')}</div>`;

const trend = `<section class="card wide"><header><h2>Last 30 days</h2><span class="muted">${greenDays} of ${history.length} day${history.length === 1 ? '' : 's'} fully green</span></header>
  <div class="trend" role="list">${history
    .map((h) => {
      const label = new Date(`${h.date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const state = h.status ?? (h.passed ? 'healthy' : 'attention');
      const text = `${label}: ${{ healthy: 'all passed', attention: 'failures', incomplete: 'incomplete' }[state]}${h.checks ? `, ${h.checks} checks` : ''}`;
      return `<a role="listitem" class="trend-day ${state}" ${h.run ? `href="${escape(h.run)}"` : ''} title="${escape(text)}" aria-label="${escape(text)}"></a>`;
    })
    .join('')}</div>
  <div class="trend-axis"><span>${escape(new Date(`${history[0].date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))}</span><span>Today</span></div>
  <div class="key"><span><i class="healthy"></i>All passed</span><span><i class="attention"></i>Failures</span><span><i class="incomplete"></i>Incomplete</span></div></section>`;

const allFailures = [...devFailures, ...playwrightRuns.flatMap((d) => d.failures)];
const attention = allFailures.length || loadFailed
  ? `<section class="card wide attention-card"><header><h2>Needs attention</h2><span class="badge bad">${plural(allFailures.length + (loadFailed ? 1 : 0), 'issue')}</span></header>
    <ul class="issues">${allFailures
      .map((f) => `<li><div><strong>${escape(f.area)}: ${escape(f.title)}</strong><span class="muted">${escape(f.device === 'Build' ? 'Development build' : f.device)}</span></div>
        <details><summary>Technical detail</summary><code>${escape(f.error)}</code>${f.file ? `<div class="muted">${escape(f.file)}</div>` : ''}</details></li>`)
      .join('')}${jmeter && loadFailed
      ? jmeter.rows.filter((r) => r.failed).map((r) => `<li><div><strong>Load: ${escape(r.action)}</strong><span class="muted">${r.failed} of ${r.samples} requests failed</span></div>
        <details><summary>Technical detail</summary><code>${r.errors.map(escape).join('\n')}</code><div class="muted">${escape(r.request)}</div></details></li>`).join('')
      : ''}</ul></section>`
  : '';

const mark = (ok) => (ok ? '<span class="tick good" aria-label="passed">✓</span>' : '<span class="tick bad" aria-label="failed">✕</span>');
const coverageCell = (data, device) => {
  if (!data) return '<td class="num muted">No results</td>';
  const counts = [...data.devices].filter(([p]) => deviceName(p) === device).map(([, c]) => c);
  if (!counts.length) return '<td class="num muted">–</td>';
  const sum = (k) => counts.reduce((n, c) => n + c[k], 0);
  const ran = sum('passed') + sum('flaky') + sum('failed');
  return `<td class="num">${mark(sum('failed') === 0)} ${sum('passed') + sum('flaky')}/${ran}${sum('flaky') ? ` <span class="warn-text">(${sum('flaky')} retried)</span>` : ''}</td>`;
};
const coverage = `<section class="card"><header><h2>Coverage by device</h2></header>
  <p class="muted">Tests passed out of tests run on each device.</p>
  <div class="scroll"><table><thead><tr><th>Device</th><th class="num">Regression</th><th class="num">Live site</th></tr></thead><tbody>${deviceOrder
    .map((device) => `<tr><td>${escape(device)}</td>${coverageCell(regression, device)}${coverageCell(smoke, device)}</tr>`)
    .join('')}</tbody></table></div></section>`;

const slowest = jmeter ? Math.max(...jmeter.actions.map((r) => r.p95), 1) : 1;
const performance = jmeter
  ? `<section class="card"><header><h2>Speed under load</h2></header>
    <p class="muted">Typical time (bar) and the time 95% of requests beat, per action on the live site.</p>
    <ul class="speed">${jmeter.actions
      .map((r) => `<li><span class="speed-name">${escape(r.action)}${r.failed ? ` <b class="bad-text">${r.failed} failed</b>` : ''}</span>
        <span class="speed-bar" aria-hidden="true"><i style="width:${Math.max((r.median / slowest) * 100, 2).toFixed(1)}%"></i><i class="p95" style="left:${((r.p95 / slowest) * 100).toFixed(1)}%"></i></span>
        <span class="speed-num">${r.median} ms <span class="muted">· ${r.p95}</span></span></li>`)
      .join('')}</ul></section>`
  : `<section class="card"><header><h2>Speed under load</h2></header><p class="muted">The load test didn't finish today.</p></section>`;

// Development: UI and API test results, and how much of the code they cover.
const meter = (label, value) =>
  `<li><span class="meter-name">${label}</span><span class="meter-value">${value != null ? `${Math.round(value)}%` : '–'}</span>
    <span class="meter-track" aria-hidden="true"><i style="width:${value ?? 0}%"></i></span></li>`;
const development = `<section class="card wide"><header><h2>Development</h2><span class="muted">UI (React) and API (Spring Boot), tested on every change</span></header>
  <div class="split">
    ${donutRow([
      donutSummary('UI unit tests', ui ? `${ui.files.length} test files · ${duration(ui.duration)}` : '', ui?.totals),
      donutSummary('API tests', api ? `${api.files.length} test classes · ${duration(api.duration)}` : '', api?.totals),
    ])}
    <div><h3>Code coverage</h3><p class="muted">Share of the code the tests run.</p>
      <ul class="meters">
        ${meter('UI · lines', ui?.coverage?.lines)}${meter('UI · branches', ui?.coverage?.branches)}
        ${meter('API · lines', api?.coverage?.lines)}${meter('API · branches', api?.coverage?.branches)}
      </ul></div>
  </div></section>`;

// Quality assurance: the end-to-end suites and the load test.
const qaSummaries = [
  donutSummary('Regression', 'Desktop and 5 phones', regression?.totals),
  donutSummary('Live site', 'Desktop, Android, iPhone', smoke?.totals),
  donutSummary('Load (JMeter)', 'Every button, under load', jmeter ? { passed: jmeter.samples - jmeter.failed, failed: jmeter.failed } : null, 'requests'),
];
const qa = `<section class="card wide"><header><h2>Quality assurance</h2><a href="3d.html">See every test in 3D →</a></header>${donutRow(qaSummaries)}</section>`;

// Delivery: what shipped in the last 30 days.
let deliveryCard = '';
if (delivery) {
  const most = Math.max(1, ...delivery.weeks.map((w) => w.merged));
  const W = 320, H = 150, base = 120, slot = W / delivery.weeks.length;
  const columns = delivery.weeks
    .map((w, i) => {
      const h = (w.merged / most) * 90;
      const x = i * slot + slot / 2 - 12;
      const label = new Date(`${w.end}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const path = h > 0 ? `M${x},${base} v${-(h - 4)} q0,-4 4,-4 h16 q4,0 4,4 v${h - 4} z` : '';
      return `<g><title>Week to ${label}: ${plural(w.merged, 'pull request')} merged</title>
        ${path ? `<path d="${path}" fill="var(--bar)"/>` : ''}
        <text x="${x + 12}" y="${base - h - 6}" text-anchor="middle" class="col-value">${w.merged}</text>
        <text x="${x + 12}" y="${base + 18}" text-anchor="middle" class="col-label">${label}</text></g>`;
    })
    .join('');
  deliveryCard = `<section class="card wide"><header><h2>Delivery</h2><span class="muted">Last ${delivery.days} days on GitHub</span></header>
    <div class="split">
      <div><div class="mini-kpis">
        <div><b>${delivery.mergedPullRequests}</b><span>pull requests merged</span></div>
        <div><b>${delivery.commits}</b><span>commits to master</span></div>
        <div><b>${percent(delivery.ciPassed, delivery.ciRuns)}</b><span>of ${delivery.ciRuns} CI runs passed</span></div>
      </div>
      ${delivery.recent.length ? `<h3>Recently merged</h3><ul class="recent">${delivery.recent.map((pr) => `<li><a href="${escape(pr.url)}">#${pr.number}</a> ${escape(pr.title)}</li>`).join('')}</ul>` : ''}</div>
      <figure class="columns"><figcaption><h3>Pull requests merged per week</h3></figcaption>
        <svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Pull requests merged per week: ${delivery.weeks.map((w) => w.merged).join(', ')}">
          <line x1="0" x2="${W}" y1="${base}" y2="${base}" stroke="var(--line)"/>${columns}</svg></figure>
    </div></section>`;
}

const reportLinks = [
  { href: '3d.html', title: 'Every test in 3D', text: 'Each test file on each device, as a chart you can turn', ok: true },
  { href: 'ui-coverage/', title: 'UI coverage report', text: ui?.coverage ? `${Math.round(ui.coverage.lines)}% of lines` : 'No results', ok: !!ui?.coverage },
  { href: 'api-coverage/', title: 'API coverage report', text: api?.coverage ? `${Math.round(api.coverage.lines)}% of lines` : 'No results', ok: !!api?.coverage },
  { href: 'regression/', title: 'Regression report', text: regression ? `${plural(regression.total, 'test')} · ${duration(regression.duration)}` : 'No results', ok: !!regression },
  { href: 'smoke/', title: 'Live site report', text: smoke ? `${plural(smoke.total, 'test')} · ${duration(smoke.duration)}` : 'No results', ok: !!smoke },
  { href: 'jmeter/', title: 'Load test dashboard', text: jmeter ? `${jmeter.samples} requests · ${duration(jmeter.duration)}` : 'No results', ok: !!jmeter },
];
const links = `<section class="card wide"><header><h2>Full technical reports</h2></header><div class="links">${reportLinks
  .map((l) => (l.ok ? `<a class="link-card" href="${l.href}"><strong>${l.title} →</strong><span>${escape(l.text)}</span></a>` : `<div class="link-card off"><strong>${l.title}</strong><span>${escape(l.text)}</span></div>`))
  .join('')}</div></section>`;

const overall = donutSummary('All checks', 'Development, QA and load', {
  passed: passedCount - flakyCount + (jmeter ? jmeter.samples - jmeter.failed : 0), failed: failureCount + loadFailed, flaky: flakyCount,
}, 'checks');
// Email image: the overall donut and development on the first row, QA on the second.
const emailSummaries = [overall, donutSummary('UI unit tests', '', ui?.totals), donutSummary('API tests', '', api?.totals), ...qaSummaries];
const tone = { healthy: 'good', attention: 'bad', incomplete: 'warn' }[status];

const dashboard = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Daily Quality Report</title>
<meta name="description" content="Daily test results for selenium-automation.com: regression, live site and load">
<style>
:root { --bg:#f5f5f7; --card:#fff; --text:#1d1d1f; --muted:#6e6e73; --line:#e5e5ea; --good:#1a7f37; --good-bg:#dafbe1; --bad:#cf222e; --bad-bg:#ffebe9; --warn:#bf8700; --warn-bg:#fff8c5; --skip:#8c8c91; --accent:#0066cc; --bar:#0066cc; color-scheme:light; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#000; --card:#1c1c1e; --text:#f5f5f7; --muted:#a1a1a6; --line:#38383a; --good:#3fb950; --good-bg:#12261a; --bad:#ff7b72; --bad-bg:#3a1416; --warn:#d29922; --warn-bg:#2e2310; --skip:#6e6e73; --accent:#2997ff; --bar:#2997ff; color-scheme:dark; } }
:root[data-theme="dark"] { --bg:#000; --card:#1c1c1e; --text:#f5f5f7; --muted:#a1a1a6; --line:#38383a; --good:#3fb950; --good-bg:#12261a; --bad:#ff7b72; --bad-bg:#3a1416; --warn:#d29922; --warn-bg:#2e2310; --skip:#6e6e73; --accent:#2997ff; --bar:#2997ff; color-scheme:dark; }
* { box-sizing:border-box; }
body { margin:0; background:var(--bg); color:var(--text); font:16px/1.5 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif; -webkit-font-smoothing:antialiased; }
main { max-width:1120px; margin:0 auto; padding:32px 16px 64px; }
a { color:var(--accent); }
.eyebrow { display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; color:var(--muted); font-size:14px; margin-bottom:20px; }
.eyebrow strong { color:var(--text); letter-spacing:.02em; }
.verdict { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:24px; background:var(--card); border-radius:22px; padding:32px; margin-bottom:20px; border-top:6px solid var(--${tone}); box-shadow:0 1px 2px rgba(0,0,0,.06); }
.pill { display:inline-flex; align-items:center; gap:8px; font-size:14px; font-weight:600; padding:5px 14px; border-radius:999px; color:var(--${tone}); background:var(--${tone}-bg); }
.verdict h1 { margin:14px 0 10px; font-size:clamp(28px, 5vw, 44px); line-height:1.08; letter-spacing:-0.025em; }
.verdict p { margin:0; max-width:760px; font-size:18px; color:var(--muted); }
.kpis { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 150px), 1fr)); gap:14px; margin-bottom:20px; }
.kpi { background:var(--card); border-radius:18px; padding:18px 20px; box-shadow:0 1px 2px rgba(0,0,0,.06); }
.kpi-label { font-size:13px; color:var(--muted); font-weight:500; }
.kpi-value { font-size:34px; font-weight:700; letter-spacing:-0.02em; font-variant-numeric:tabular-nums; line-height:1.2; margin-top:2px; }
.kpi-value.good { color:var(--good); } .kpi-value.bad { color:var(--bad); }
.kpi-sub { font-size:13px; color:var(--muted); }
.grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 440px), 1fr)); gap:20px; }
.card { background:var(--card); border-radius:18px; padding:24px; box-shadow:0 1px 2px rgba(0,0,0,.06); min-width:0; }
.card.wide { grid-column:1 / -1; }
.card header { display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:8px 12px; }
.card h2 { margin:0; font-size:21px; letter-spacing:-0.01em; }
.card header a { font-size:15px; font-weight:500; text-decoration:none; }
.muted { color:var(--muted); font-size:14px; }
.badge { font-size:13px; font-weight:600; padding:3px 10px; border-radius:999px; }
.badge.bad { color:var(--bad); background:var(--bad-bg); }
.attention-card { border-left:6px solid var(--bad); }
.issues { list-style:none; margin:12px 0 0; padding:0; }
.issues li { padding:14px 0; border-bottom:1px solid var(--line); }
.issues li:last-child { border-bottom:0; }
.issues strong { display:block; }
.issues details { margin-top:6px; font-size:14px; }
.issues summary { cursor:pointer; color:var(--accent); }
.issues code { display:block; margin:8px 0 4px; color:var(--bad); font-size:13px; white-space:pre-wrap; word-break:break-word; }
.trend { display:flex; gap:4px; margin-top:16px; }
.trend-day { flex:1 1 0; max-width:28px; height:40px; border-radius:6px; }
.trend-day.healthy, .key .healthy { background:var(--good); } .trend-day.attention, .key .attention { background:var(--bad); } .trend-day.incomplete, .key .incomplete { background:var(--warn); }
.trend-axis { display:flex; justify-content:space-between; color:var(--muted); font-size:12px; margin-top:6px; max-width:${Math.max(history.length, 2) * 32}px; }
.key { display:flex; flex-wrap:wrap; gap:4px 16px; font-size:13px; color:var(--muted); margin-top:12px; }
.key i { display:inline-block; width:10px; height:10px; border-radius:3px; margin-right:6px; vertical-align:-1px; }
.scroll { overflow-x:auto; }
table { width:100%; border-collapse:collapse; font-size:15px; margin-top:8px; }
th, td { text-align:left; padding:10px 6px; border-bottom:1px solid var(--line); }
th { color:var(--muted); font-weight:500; font-size:12px; text-transform:uppercase; letter-spacing:.05em; }
.num { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
.tick { font-weight:700; margin-right:4px; } .tick.good { color:var(--good); } .tick.bad { color:var(--bad); }
.warn-text { color:var(--warn); font-size:13px; } .bad-text { color:var(--bad); font-size:13px; }
.speed { list-style:none; margin:12px 0 0; padding:0; }
.speed li { display:grid; grid-template-columns:minmax(0, 1fr) 90px; grid-template-areas:"name num" "bar bar"; gap:4px 12px; padding:8px 0; border-bottom:1px solid var(--line); font-size:14px; }
.speed-name { grid-area:name; } .speed-num { grid-area:num; text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
.speed-bar { grid-area:bar; position:relative; height:8px; background:var(--line); border-radius:4px; }
.speed-bar i { position:absolute; left:0; top:0; bottom:0; background:var(--bar); border-radius:4px; }
.speed-bar i.p95 { width:2px; background:var(--text); opacity:.5; border-radius:0; top:-3px; bottom:-3px; }
.links { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap:12px; margin-top:14px; }
.link-card { display:flex; flex-direction:column; gap:4px; padding:16px 18px; border-radius:14px; background:var(--bg); text-decoration:none; color:var(--text); }
.link-card strong { color:var(--accent); } .link-card span { color:var(--muted); font-size:14px; }
.link-card.off strong { color:var(--muted); }
a.link-card:hover { outline:2px solid var(--accent); }
.verdict > div:first-child { flex:1 1 420px; }
.verdict-chart .donuts { margin:0; grid-template-columns:1fr; }
.card h3 { margin:0; font-size:16px; }
.split { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 320px), 1fr)); gap:28px; align-items:start; margin-top:12px; }
.split .donuts { margin-top:0; }
.meters { list-style:none; margin:12px 0 0; padding:0; }
.meters li { display:grid; grid-template-columns:1fr auto; grid-template-areas:"name value" "track track"; gap:4px 8px; padding:8px 0; font-size:14px; }
.meter-name { grid-area:name; } .meter-value { grid-area:value; font-weight:600; font-variant-numeric:tabular-nums; }
.meter-track { grid-area:track; height:8px; background:var(--line); border-radius:4px; overflow:hidden; }
.meter-track i { display:block; height:100%; background:var(--bar); border-radius:4px; }
.mini-kpis { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-bottom:18px; }
.mini-kpis div { background:var(--bg); border-radius:12px; padding:12px 14px; }
.mini-kpis b { display:block; font-size:26px; letter-spacing:-0.02em; font-variant-numeric:tabular-nums; }
.mini-kpis span { font-size:12px; color:var(--muted); }
.recent { list-style:none; margin:8px 0 0; padding:0; font-size:14px; }
.recent li { padding:6px 0; border-bottom:1px solid var(--line); }
.columns { margin:0; } .columns svg { max-width:420px; display:block; margin-top:10px; }
.col-value { font-size:12px; font-weight:600; fill:var(--text); } .col-label { font-size:11px; fill:var(--muted); }
footer { margin-top:32px; color:var(--muted); font-size:13px; }
${overviewStyles}
</style></head>
<body><main>
  <div class="eyebrow"><strong>Daily quality report · selenium-automation.com</strong><span>${day}</span></div>
  <section class="verdict"><div>
    <span class="pill">${{ healthy: '✓', attention: '✕', incomplete: '!' }[status]} ${statusText}</span>
    <h1>${escape(headline)}</h1>
    <p>${escape(summary)}</p></div>
    <div class="verdict-chart">${donutRow([overall])}</div>
  </section>
  ${kpiRow}
  <div class="grid">
    ${attention}
    ${development}
    ${qa}
    ${deliveryCard}
    ${trend}
    ${coverage}
    ${performance}
    ${links}
  </div>
  <footer>Runs every morning from GitHub Actions${runURL ? ` · <a href="${runURL}">This run</a>` : ''} · <a href="https://github.com/shane24sweeney/aboutshane">Source</a></footer>
</main></body></html>`;

// ---- 3D grid data ----------------------------------------------------------------------------

const projectOrder = Object.keys(projects);
const allCells = playwrightRuns.flatMap((d) => [...d.cells.values()]);
const files = [...new Set(allCells.map((c) => c.file))].sort((a, b) => {
  // Regression files first, then the live-site ones; alphabetical within each.
  const live = (f) => (f.startsWith('smoke/') ? 1 : 0);
  return live(a) - live(b) || areaName(a).localeCompare(areaName(b));
});
// Development rows first (one bar in the Build column), then each end-to-end test file, then load.
const devRows = [['UI unit tests', ui, 'ui-coverage/'], ['API tests', api, 'api-coverage/']].filter(([, data]) => data);
const gridRows = [...devRows.map(([name]) => ({ name })), ...files.map((file) => ({ name: areaName(file) })), ...(jmeter ? [{ name: 'Load test (JMeter)' }] : [])];
const gridColumns = [{ name: 'Build' }, ...projectOrder.map((p) => ({ name: projects[p].short })), ...(jmeter ? [{ name: 'Load' }] : [])];
const gridCells = {};
devRows.forEach(([, data, link], r) => {
  gridCells[`${r}|0`] = {
    passed: data.totals.passed, failed: data.totals.failed, flaky: 0, skipped: data.totals.skipped, link,
    tests: data.files.flatMap((f) => f.tests.map((t) => ({ t: `${f.name} › ${t.t}`, s: t.s }))),
  };
});
for (const cell of allCells) {
  const r = devRows.length + files.indexOf(cell.file);
  const c = 1 + projectOrder.indexOf(cell.project);
  if (c < 1) continue;
  const query = `p:${cell.project} ${basename(cell.file)}`;
  gridCells[`${r}|${c}`] = {
    passed: cell.passed, failed: cell.failed, flaky: cell.flaky, skipped: cell.skipped, tests: cell.tests,
    link: `${projects[cell.project].suite}/#?q=${encodeURIComponent(query)}`,
  };
}
if (jmeter) {
  gridCells[`${devRows.length + files.length}|${projectOrder.length + 1}`] = {
    passed: jmeter.samples - jmeter.failed, failed: jmeter.failed, flaky: 0, skipped: 0, link: 'jmeter/',
    tests: jmeter.actions.map((r) => ({ t: `${r.action}: ${r.samples} requests, typical ${r.median} ms`, s: r.failed ? 'failed' : 'passed' })),
  };
}

// ---- Email (inline styles and tables: email apps ignore <style>, grid and SVG) ----------------

const chartFile = join(inputs, 'email-chart.png');
const chart = await renderEmailChart(emailSummaries, chartFile);

const colour = { healthy: '#1a7f37', attention: '#cf222e', incomplete: '#9a6700' }[status];
const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const cell = 'padding:10px 8px;border-bottom:1px solid #e5e5ea;font-size:14px;';
const numCell = `${cell}text-align:right;white-space:nowrap;`;
const head = 'padding:8px;border-bottom:1px solid #e5e5ea;font-size:11px;color:#6e6e73;text-transform:uppercase;letter-spacing:.05em;font-weight:500;';
const section = (title, body) =>
  `<tr><td style="padding:28px 32px 0;"><div style="font-size:18px;font-weight:700;color:#1d1d1f;margin:0 0 6px;">${title}</div>${body}</td></tr>`;
const table = (rows) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows}</table>`;

const kpiTableOf = (items) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="6" style="border-collapse:separate;"><tr>${items
  .map((k) => `<td width="${Math.floor(100 / items.length)}%" valign="top" style="padding:14px 10px;background:#f5f5f7;border-radius:12px;">
  <div style="font-size:12px;color:#6e6e73;">${k.label}</div>
  <div style="font-size:24px;font-weight:700;color:${k.tone === 'good' ? '#1a7f37' : k.tone === 'bad' ? '#cf222e' : '#1d1d1f'};margin-top:2px;">${escape(k.value)}</div>
  ${k.sub ? `<div style="font-size:11px;color:#6e6e73;">${escape(k.sub)}</div>` : ''}</td>`)
  .join('')}</tr></table>`;
// Six headline numbers, three per row so they fit a phone.
const kpiTable = kpiTableOf(kpis.slice(0, 3)) + kpiTableOf(kpis.slice(3, 6));

const emailIssues = [
  ...allFailures.slice(0, 10).map((f) => `<tr><td style="${cell}"><strong>${escape(f.area)}: ${escape(f.title)}</strong><br><span style="color:#6e6e73;font-size:13px;">${escape(f.device)}</span></td></tr>`),
  ...(jmeter?.rows.filter((r) => r.failed).map((r) => `<tr><td style="${cell}"><strong>Load: ${escape(r.action)}</strong><br><span style="color:#6e6e73;font-size:13px;">${r.failed} of ${r.samples} requests failed</span></td></tr>`) ?? []),
].join('');

const emailCoverage = deviceOrder
  .map((device) => {
    const part = (data) => {
      if (!data) return '<span style="color:#6e6e73;">No results</span>';
      const counts = [...data.devices].filter(([p]) => deviceName(p) === device).map(([, c]) => c);
      if (!counts.length) return '<span style="color:#6e6e73;">–</span>';
      const failed = counts.reduce((n, c) => n + c.failed, 0);
      const ok = counts.reduce((n, c) => n + c.passed + c.flaky, 0);
      return `<span style="color:${failed ? '#cf222e' : '#1a7f37'};font-weight:700;">${failed ? '✕' : '✓'}</span> ${ok}/${ok + failed}`;
    };
    return `<tr><td style="${cell}">${escape(device)}</td><td style="${numCell}">${part(regression)}</td><td style="${numCell}">${part(smoke)}</td></tr>`;
  })
  .join('');

const emailSpeed = (jmeter?.actions ?? [])
  .map((r) => `<tr><td style="${cell}">${escape(r.action)}</td><td style="${numCell}">${r.median} ms</td><td style="${numCell}color:#6e6e73;">${r.p95} ms</td>
    <td style="${numCell}">${r.failed ? `<span style="color:#cf222e;font-weight:700;">${r.failed} failed</span>` : '<span style="color:#1a7f37;font-weight:700;">✓</span>'}</td></tr>`)
  .join('');

const email = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(headline)}</title></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:${font};color:#1d1d1f;">
<div style="display:none;max-height:0;overflow:hidden;">${escape(summary)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;">
  <tr><td style="height:6px;background:${colour};font-size:0;line-height:0;">&nbsp;</td></tr>
  <tr><td style="padding:28px 32px 0;">
    <div style="font-size:12px;color:#6e6e73;letter-spacing:.04em;text-transform:uppercase;font-weight:600;">Daily quality report · selenium-automation.com</div>
    <div style="font-size:13px;color:#6e6e73;margin-top:2px;">${day}</div>
    <div style="margin-top:18px;"><span style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:700;color:${colour};background:${{ healthy: '#dafbe1', attention: '#ffebe9', incomplete: '#fff8c5' }[status]};">${{ healthy: '✓', attention: '✕', incomplete: '!' }[status]} ${statusText}</span></div>
    <div style="font-size:28px;font-weight:700;line-height:1.15;letter-spacing:-0.02em;margin-top:12px;">${escape(headline)}</div>
    <div style="font-size:16px;line-height:1.5;color:#424245;margin-top:10px;">${escape(summary)}</div>
  </td></tr>
  <tr><td style="padding:22px 26px 0;">${kpiTable}</td></tr>
  ${emailIssues ? section('Needs attention', table(emailIssues)) : ''}
  ${chart ? section('At a glance', `<img src="cid:charts" width="576" alt="Donut charts: ${escape(emailSummaries.map((s) => (s.counts ? `${s.name} ${Object.entries(s.counts).map(([k, n]) => `${n} ${k}`).join(', ')}` : `${s.name} no results`)).join('; '))}" style="display:block;width:100%;max-width:576px;height:auto;border:0;">`) : ''}
  ${devRuns.length ? section('Development', table(`<tr><th align="left" style="${head}">Area</th><th align="right" style="${head}">Tests passed</th><th align="right" style="${head}">Code coverage</th></tr>${[['UI (React)', ui], ['API (Spring Boot)', api]]
    .map(([name, d]) => `<tr><td style="${cell}">${name}</td><td style="${numCell}">${d ? `<span style="color:${d.totals.failed ? '#cf222e' : '#1a7f37'};font-weight:700;">${d.totals.failed ? '✕' : '✓'}</span> ${d.totals.passed}/${d.totals.passed + d.totals.failed}` : 'No results'}</td><td style="${numCell}">${d?.coverage ? `${Math.round(d.coverage.lines)}% of lines` : '–'}</td></tr>`)
    .join('')}`)) : ''}
  ${section('Coverage by device', table(`<tr><th align="left" style="${head}">Device</th><th align="right" style="${head}">Regression</th><th align="right" style="${head}">Live site</th></tr>${emailCoverage}`))}
  ${emailSpeed ? section('Speed under load', table(`<tr><th align="left" style="${head}">Action</th><th align="right" style="${head}">Typical</th><th align="right" style="${head}">95% within</th><th align="right" style="${head}">Result</th></tr>${emailSpeed}`)) : ''}
  ${delivery ? section(`Delivery, last ${delivery.days} days`, kpiTableOf([
    { label: 'Pull requests merged', value: String(delivery.mergedPullRequests) },
    { label: 'Commits to master', value: String(delivery.commits) },
    { label: 'CI runs passed', value: percent(delivery.ciPassed, delivery.ciRuns), sub: `of ${delivery.ciRuns}` },
  ])) : ''}
  <tr><td align="center" style="padding:32px;">
    <a href="${siteURL}" style="display:inline-block;background:#0066cc;color:#ffffff;text-decoration:none;font-weight:600;padding:13px 26px;border-radius:999px;">Open the full report</a>
    <div style="margin-top:12px;font-size:13px;"><a href="${siteURL}3d.html" style="color:#0066cc;">Every test in 3D</a>${runURL ? ` · <a href="${runURL}" style="color:#0066cc;">GitHub Actions run</a>` : ''}</div>
  </td></tr>
</table>
<div style="font-size:12px;color:#6e6e73;padding:16px;">Sent every morning by GitHub Actions for selenium-automation.com.</div>
</td></tr></table></body></html>`;

// ---- Write ---------------------------------------------------------------------------------

mkdirSync(site, { recursive: true });
for (const key of ['regression', 'smoke']) {
  const report = join(inputs, key, 'playwright-report');
  if (existsSync(report)) cpSync(report, join(site, key), { recursive: true });
}
if (existsSync(join(inputs, 'ui', 'coverage', 'index.html'))) cpSync(join(inputs, 'ui', 'coverage'), join(site, 'ui-coverage'), { recursive: true });
if (existsSync(join(inputs, 'api', 'site', 'jacoco', 'index.html'))) cpSync(join(inputs, 'api', 'site', 'jacoco'), join(site, 'api-coverage'), { recursive: true });
const jmeterReport = join(inputs, 'jmeter', 'tests', 'jmeter', 'results', 'report');
if (existsSync(jmeterReport)) cpSync(jmeterReport, join(site, 'jmeter'), { recursive: true });
writeFileSync(join(site, 'index.html'), dashboard);
writeFileSync(join(site, '3d.html'), gridPage({ rows: gridRows, columns: gridColumns, cells: gridCells, headline, day }));
writeFileSync(join(site, 'history.json'), JSON.stringify(history, null, 2));
// Jekyll would hide the reports' _-prefixed folders.
writeFileSync(join(site, '.nojekyll'), '');
writeFileSync(join(inputs, 'email.html'), email);
writeFileSync(join(inputs, 'email-subject.txt'), `${{ healthy: '✅', attention: '❌', incomplete: '⚠️' }[status]} ${statusText}: ${headline} · ${shortDay}`);
console.log(`${statusText.toUpperCase()}: ${headline}${chart ? '' : ' (no email chart)'}`);
