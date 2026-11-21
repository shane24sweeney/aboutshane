// Builds the daily test report: a dashboard for GitHub Pages and an HTML email.
//
//   node scripts/test-report/build.mjs <inputs> <site>
//
// <inputs> holds the downloaded workflow artifacts:
//   regression/  playwright-report/ and test-results/results.json (desktop and the 5 phones)
//   smoke/       the same, from the live site
//   jmeter/      tests/jmeter/results/results.jtl and report/
// <site> gets index.html, history.json, each full report, email.html and email-subject.txt.
// Missing inputs (a job that didn't finish) show as "no results" and count as a failure.

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [inputs = 'reports', site = 'site'] = process.argv.slice(2);
const siteURL = process.env.REPORT_SITE_URL ?? 'https://shane24sweeney.github.io/aboutshane/';
const runURL = process.env.GITHUB_RUN_ID
  ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
  : '';

const deviceNames = {
  desktop: 'Desktop (Chrome)',
  mobile: 'Android, Pixel 7',
  'mobile-small': 'Android, Galaxy S24',
  'mobile-safari': 'iPhone 15',
  'mobile-safari-small': 'iPhone SE',
  'mobile-safari-large': 'iPhone 15 Pro Max',
  production: 'Desktop (Chrome)',
  'production-mobile': 'Android, Pixel 7',
  'production-mobile-safari': 'iPhone 15',
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
const seconds = (ms) => (ms >= 60_000 ? `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s` : `${Math.round(ms / 1000)}s`);

// ---- Playwright --------------------------------------------------------------------------

function readPlaywright(dir) {
  const file = join(inputs, dir, 'test-results', 'results.json');
  if (!existsSync(file)) return null;
  const json = JSON.parse(readFileSync(file, 'utf8'));
  const devices = new Map();
  const failures = [];
  const walk = (suite, path) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests) {
        const device = devices.get(test.projectName) ?? { passed: 0, failed: 0, flaky: 0, skipped: 0 };
        devices.set(test.projectName, device);
        const outcome = { expected: 'passed', unexpected: 'failed', flaky: 'flaky', skipped: 'skipped' }[test.status];
        device[outcome] += 1;
        if (outcome === 'failed') {
          const error = test.results.map((r) => r.error?.message).find(Boolean);
          failures.push({
            title: [...path, spec.title].filter(Boolean).join(' › '),
            file: `${spec.file}:${spec.line}`,
            device: deviceNames[test.projectName] ?? test.projectName,
            error: summarise(error),
          });
        }
      }
    }
    for (const child of suite.suites ?? []) walk(child, [...path, child.title]);
  };
  for (const suite of json.suites) walk(suite, []);
  const totals = { passed: json.stats.expected, failed: json.stats.unexpected, flaky: json.stats.flaky, skipped: json.stats.skipped };
  return { totals, devices, failures, duration: json.stats.duration, started: json.stats.startTime };
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
    return {
      name,
      samples: label.samples,
      failed: label.failed,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)],
      max: sorted.at(-1),
      errors: [...label.errors],
    };
  });
  const samples = rows.reduce((n, r) => n + r.samples, 0);
  const failed = rows.reduce((n, r) => n + r.failed, 0);
  return { rows, samples, failed, duration: lines.length ? last - first : 0 };
}

// ---- Gather --------------------------------------------------------------------------------

const regression = readPlaywright('regression');
const smoke = readPlaywright('smoke');
const jmeter = readJMeter();

const suites = [
  { key: 'regression', name: 'Regression', blurb: 'Desktop and 5 phones, against the production build', data: regression, report: 'regression/' },
  { key: 'smoke', name: 'Live smoke', blurb: 'The live site and API, on desktop, Android and iPhone', data: smoke, report: 'smoke/' },
];
const testsPassed = (data) => data && data.totals.failed === 0;
const allPassed = suites.every((s) => testsPassed(s.data)) && jmeter !== null && jmeter.failed === 0 && jmeter.samples > 0;
const testCount = suites.reduce((n, s) => n + (s.data ? Object.values(s.data.totals).reduce((a, b) => a + b, 0) : 0), 0);
const failureCount = suites.reduce((n, s) => n + (s.data?.totals.failed ?? 0), 0);
const missing = [...suites.filter((s) => !s.data).map((s) => s.name), ...(jmeter ? [] : ['JMeter load'])];

const now = new Date();
const day = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Chicago' });
const shortDay = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Chicago' });

let headline;
if (allPassed) headline = `All ${testCount} tests and ${jmeter.samples} load requests passed`;
else {
  const parts = [];
  if (failureCount) parts.push(`${failureCount} test${failureCount === 1 ? '' : 's'} failed`);
  if (jmeter?.failed) parts.push(`${jmeter.failed} load request${jmeter.failed === 1 ? '' : 's'} failed`);
  if (missing.length) parts.push(`no results from ${missing.join(' and ')}`);
  headline = parts.join(', ').replace(/^./, (c) => c.toUpperCase());
}

// History: yesterday's site holds the earlier days. Keep 30.
let history = [];
try {
  const response = await fetch(new URL('history.json', siteURL), { signal: AbortSignal.timeout(10_000) });
  if (response.ok) history = await response.json();
} catch {
  // First run, or Pages is down: start a new history.
}
history = [
  ...history.filter((entry) => entry.date !== now.toISOString().slice(0, 10)),
  { date: now.toISOString().slice(0, 10), passed: allPassed, tests: testCount, failed: failureCount, loadFailed: jmeter?.failed ?? null, run: runURL },
].slice(-30);

// ---- Dashboard -----------------------------------------------------------------------------

const stat = (label, value, tone) => `<div class="stat ${tone}"><span>${value}</span>${label}</div>`;

function suiteCard(suite) {
  const { data } = suite;
  if (!data) {
    return `<section class="card"><header><h2>${suite.name}</h2><span class="badge fail">No results</span></header>
      <p class="muted">${suite.blurb}. The job didn't finish${runURL ? `; see the <a href="${runURL}">workflow run</a>` : ''}.</p></section>`;
  }
  const ok = testsPassed(data);
  const rows = [...data.devices]
    .map(([project, d]) => `<tr><td>${escape(deviceNames[project] ?? project)}</td><td class="num">${d.passed}</td>
      <td class="num ${d.failed ? 'bad' : ''}">${d.failed}</td><td class="num ${d.flaky ? 'warn' : ''}">${d.flaky}</td><td class="num">${d.skipped}</td></tr>`)
    .join('');
  return `<section class="card">
    <header><h2>${suite.name}</h2><span class="badge ${ok ? 'pass' : 'fail'}">${ok ? 'Passed' : 'Failed'}</span></header>
    <p class="muted">${suite.blurb}. Took ${seconds(data.duration)}.</p>
    <div class="stats">${stat('passed', data.totals.passed, 'good')}${stat('failed', data.totals.failed, data.totals.failed ? 'bad' : '')}${stat('flaky', data.totals.flaky, data.totals.flaky ? 'warn' : '')}${stat('skipped', data.totals.skipped, '')}</div>
    <div class="scroll"><table><thead><tr><th>Device</th><th class="num">Passed</th><th class="num">Failed</th><th class="num">Flaky</th><th class="num">Skipped</th></tr></thead><tbody>${rows}</tbody></table></div>
    <a class="button" href="${suite.report}">Open the full Playwright report →</a>
  </section>`;
}

function jmeterCard() {
  if (!jmeter) {
    return `<section class="card"><header><h2>JMeter load</h2><span class="badge fail">No results</span></header>
      <p class="muted">The request behind every button, under light load. The job didn't finish.</p></section>`;
  }
  const ok = jmeter.failed === 0 && jmeter.samples > 0;
  const rows = jmeter.rows
    .map((r) => `<tr><td>${escape(r.name)}${r.errors.length ? `<div class="error">${r.errors.map(escape).join('<br>')}</div>` : ''}</td>
      <td class="num">${r.samples}</td><td class="num ${r.failed ? 'bad' : ''}">${r.failed}</td><td class="num">${r.median}</td><td class="num">${r.p95}</td><td class="num">${r.max}</td></tr>`)
    .join('');
  return `<section class="card wide">
    <header><h2>JMeter load</h2><span class="badge ${ok ? 'pass' : 'fail'}">${ok ? 'Passed' : 'Failed'}</span></header>
    <p class="muted">The request behind every button on the live site, under light load. Took ${seconds(jmeter.duration)}.</p>
    <div class="stats">${stat('requests', jmeter.samples, 'good')}${stat('failed', jmeter.failed, jmeter.failed ? 'bad' : '')}</div>
    <div class="scroll"><table><thead><tr><th>Button</th><th class="num">Requests</th><th class="num">Failed</th><th class="num">Median ms</th><th class="num">95th % ms</th><th class="num">Max ms</th></tr></thead><tbody>${rows}</tbody></table></div>
    <a class="button" href="jmeter/">Open the full JMeter dashboard →</a>
  </section>`;
}

const allFailures = suites.flatMap((s) => (s.data?.failures ?? []).map((f) => ({ ...f, suite: s.name })));
const failuresCard = allFailures.length
  ? `<section class="card wide"><header><h2>Failures</h2></header><ul class="failures">${allFailures
      .map((f) => `<li><strong>${escape(f.title)}</strong><span class="muted">${escape(f.suite)} · ${escape(f.device)} · ${escape(f.file)}</span><code>${escape(f.error)}</code></li>`)
      .join('')}</ul></section>`
  : '';

const historyStrip = history
  .map((h) => `<a class="day ${h.passed ? 'pass' : 'fail'}" ${h.run ? `href="${escape(h.run)}"` : ''} title="${h.date}: ${h.passed ? 'passed' : 'failed'}, ${h.tests} tests"></a>`)
  .join('');

const dashboard = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Daily Test Report</title>
<meta name="description" content="Daily Playwright, mobile and JMeter results for selenium-automation.com">
<style>
:root { --bg:#f5f5f7; --card:#fff; --text:#1d1d1f; --muted:#6e6e73; --line:#e5e5ea; --good:#1a7f37; --good-bg:#dafbe1; --bad:#cf222e; --bad-bg:#ffebe9; --warn:#9a6700; --warn-bg:#fff8c5; --accent:#0066cc; color-scheme: light; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#000; --card:#1c1c1e; --text:#f5f5f7; --muted:#a1a1a6; --line:#38383a; --good:#3fb950; --good-bg:#12261a; --bad:#ff7b72; --bad-bg:#3a1416; --warn:#d29922; --warn-bg:#2e2310; --accent:#2997ff; color-scheme: dark; } }
:root[data-theme="dark"] { --bg:#000; --card:#1c1c1e; --text:#f5f5f7; --muted:#a1a1a6; --line:#38383a; --good:#3fb950; --good-bg:#12261a; --bad:#ff7b72; --bad-bg:#3a1416; --warn:#d29922; --warn-bg:#2e2310; --accent:#2997ff; color-scheme: dark; }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--text); font:16px/1.5 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif; }
main { max-width:1100px; margin:0 auto; padding:40px 16px 64px; }
a { color:var(--accent); }
.hero { display:flex; gap:20px; align-items:center; margin-bottom:28px; }
.hero .mark { flex:none; width:64px; height:64px; border-radius:50%; display:grid; place-items:center; font-size:34px; color:#fff; background:${allPassed ? 'var(--good)' : 'var(--bad)'}; }
.hero h1 { margin:0; font-size:clamp(24px, 4vw, 34px); line-height:1.15; letter-spacing:-0.02em; }
.hero p { margin:4px 0 0; color:var(--muted); }
.history { display:flex; flex-wrap:wrap; gap:4px; align-items:center; margin:0 0 28px; color:var(--muted); font-size:13px; }
.history .day { width:14px; height:28px; border-radius:4px; }
.history .day.pass { background:var(--good); } .history .day.fail { background:var(--bad); }
.history span { margin-right:8px; }
.grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 460px), 1fr)); gap:20px; }
.card { background:var(--card); border-radius:18px; padding:24px; box-shadow:0 1px 2px rgba(0,0,0,.06); min-width:0; }
.card.wide { grid-column:1 / -1; }
.card header { display:flex; justify-content:space-between; align-items:center; gap:12px; }
.card h2 { margin:0; font-size:21px; letter-spacing:-0.01em; }
.muted { color:var(--muted); font-size:14px; }
.badge { font-size:13px; font-weight:600; padding:3px 10px; border-radius:999px; white-space:nowrap; }
.badge.pass { color:var(--good); background:var(--good-bg); } .badge.fail { color:var(--bad); background:var(--bad-bg); }
.stats { display:flex; flex-wrap:wrap; gap:10px; margin:16px 0; }
.stat { flex:1 1 90px; background:var(--bg); border-radius:12px; padding:10px 14px; font-size:13px; color:var(--muted); }
.stat span { display:block; font-size:26px; font-weight:600; color:var(--text); font-variant-numeric:tabular-nums; }
.stat.good span { color:var(--good); } .stat.bad span { color:var(--bad); } .stat.warn span { color:var(--warn); }
.scroll { overflow-x:auto; }
table { width:100%; border-collapse:collapse; font-size:14px; }
th, td { text-align:left; padding:8px 6px; border-bottom:1px solid var(--line); }
th { color:var(--muted); font-weight:500; font-size:12px; text-transform:uppercase; letter-spacing:.04em; }
.num { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
td.bad { color:var(--bad); font-weight:600; } td.warn { color:var(--warn); font-weight:600; }
.error { color:var(--bad); font-size:12px; margin-top:2px; }
.button { display:inline-block; margin-top:16px; font-weight:500; text-decoration:none; }
.button:hover { text-decoration:underline; }
.failures { list-style:none; margin:12px 0 0; padding:0; }
.failures li { padding:12px 0; border-bottom:1px solid var(--line); display:grid; gap:2px; }
.failures code { color:var(--bad); font-size:13px; white-space:pre-wrap; word-break:break-word; }
footer { margin-top:32px; color:var(--muted); font-size:13px; }
</style></head>
<body><main>
  <div class="hero"><div class="mark" aria-hidden="true">${allPassed ? '✓' : '✕'}</div>
    <div><h1>${escape(headline)}</h1><p>selenium-automation.com · ${day}</p></div></div>
  <div class="history" aria-label="Last ${history.length} days"><span>Last ${history.length} day${history.length === 1 ? '' : 's'}</span>${historyStrip}</div>
  <div class="grid">${failuresCard}${suites.map(suiteCard).join('')}${jmeterCard()}</div>
  <footer>Runs every morning from GitHub Actions${runURL ? ` · <a href="${runURL}">This run</a>` : ''} · <a href="https://github.com/shane24sweeney/aboutshane">Source</a></footer>
</main></body></html>`;

// ---- Email (inline styles and tables: email apps ignore <style> and grid) ------------------------

const cell = 'padding:8px 10px;border-bottom:1px solid #e5e5ea;font-size:14px;';
const numCell = `${cell}text-align:right;`;
const head = 'padding:8px 10px;border-bottom:1px solid #e5e5ea;font-size:11px;color:#6e6e73;text-transform:uppercase;letter-spacing:.04em;';
const pill = (ok, text) =>
  `<span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;${ok ? 'color:#1a7f37;background:#dafbe1;' : 'color:#cf222e;background:#ffebe9;'}">${text}</span>`;

const emailRows = [
  ...suites.map((s) =>
    s.data
      ? `<tr><td style="${cell}"><strong>${s.name}</strong><br><span style="color:#6e6e73;font-size:12px;">${s.data.devices.size} devices · ${seconds(s.data.duration)}</span></td>
         <td style="${numCell}color:#1a7f37;">${s.data.totals.passed}</td><td style="${numCell}${s.data.totals.failed ? 'color:#cf222e;font-weight:600;' : ''}">${s.data.totals.failed}</td>
         <td style="${numCell}">${s.data.totals.flaky}</td><td style="${cell}text-align:right;">${pill(testsPassed(s.data), testsPassed(s.data) ? 'Passed' : 'Failed')}</td></tr>`
      : `<tr><td style="${cell}"><strong>${s.name}</strong></td><td colspan="3" style="${cell}color:#6e6e73;">No results</td><td style="${cell}text-align:right;">${pill(false, 'Failed')}</td></tr>`,
  ),
  jmeter
    ? `<tr><td style="${cell}"><strong>JMeter load</strong><br><span style="color:#6e6e73;font-size:12px;">${jmeter.rows.length} buttons · ${jmeter.samples} requests</span></td>
       <td style="${numCell}color:#1a7f37;">${jmeter.samples - jmeter.failed}</td><td style="${numCell}${jmeter.failed ? 'color:#cf222e;font-weight:600;' : ''}">${jmeter.failed}</td>
       <td style="${numCell}">–</td><td style="${cell}text-align:right;">${pill(jmeter.failed === 0, jmeter.failed === 0 ? 'Passed' : 'Failed')}</td></tr>`
    : `<tr><td style="${cell}"><strong>JMeter load</strong></td><td colspan="3" style="${cell}color:#6e6e73;">No results</td><td style="${cell}text-align:right;">${pill(false, 'Failed')}</td></tr>`,
].join('');

const deviceRows = suites
  .filter((s) => s.data)
  .flatMap((s) => [...s.data.devices].map(([project, d]) => ({ suite: s.name, project, ...d })))
  .map((d) => `<tr><td style="${cell}">${escape(deviceNames[d.project] ?? d.project)} <span style="color:#6e6e73;font-size:12px;">${d.suite}</span></td>
    <td style="${numCell}">${d.passed}</td><td style="${numCell}${d.failed ? 'color:#cf222e;font-weight:600;' : ''}">${d.failed}</td><td style="${numCell}">${d.flaky}</td></tr>`)
  .join('');

const loadRows = (jmeter?.rows ?? [])
  .map((r) => `<tr><td style="${cell}">${escape(r.name)}</td><td style="${numCell}">${r.median}</td><td style="${numCell}">${r.p95}</td>
    <td style="${numCell}${r.failed ? 'color:#cf222e;font-weight:600;' : ''}">${r.failed}</td></tr>`)
  .join('');

const emailFailures = allFailures.slice(0, 15)
  .map((f) => `<tr><td style="${cell}"><strong>${escape(f.title)}</strong><br><span style="color:#6e6e73;font-size:12px;">${escape(f.suite)} · ${escape(f.device)}</span><br>
    <span style="color:#cf222e;font-family:Menlo,Consolas,monospace;font-size:12px;">${escape(f.error).replace(/\n/g, '<br>')}</span></td></tr>`)
  .join('');

const section = (title, body) =>
  `<tr><td style="padding:24px 28px 0;"><h2 style="margin:0 0 8px;font-size:17px;color:#1d1d1f;">${title}</h2>
   <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${body}</table></td></tr>`;

const email = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(headline)}</title></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d1d1f;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;">
  <tr><td style="padding:28px;background:${allPassed ? '#1a7f37' : '#cf222e'};color:#ffffff;">
    <div style="font-size:13px;opacity:.85;">Daily test report · ${day}</div>
    <div style="font-size:24px;font-weight:700;line-height:1.25;margin-top:6px;">${allPassed ? '✓' : '✕'} ${escape(headline)}</div>
  </td></tr>
  ${section('Suites', `<tr><th align="left" style="${head}">Suite</th><th align="right" style="${head}">Passed</th><th align="right" style="${head}">Failed</th><th align="right" style="${head}">Flaky</th><th style="${head}"></th></tr>${emailRows}`)}
  ${emailFailures ? section(`Failures${allFailures.length > 15 ? ` (first 15 of ${allFailures.length})` : ''}`, emailFailures) : ''}
  ${deviceRows ? section('By device', `<tr><th align="left" style="${head}">Device</th><th align="right" style="${head}">Passed</th><th align="right" style="${head}">Failed</th><th align="right" style="${head}">Flaky</th></tr>${deviceRows}`) : ''}
  ${loadRows ? section('Load, per button', `<tr><th align="left" style="${head}">Button</th><th align="right" style="${head}">Median ms</th><th align="right" style="${head}">95th % ms</th><th align="right" style="${head}">Failed</th></tr>${loadRows}`) : ''}
  <tr><td align="center" style="padding:28px;">
    <a href="${siteURL}" style="display:inline-block;background:#0066cc;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px;">Open the full reports</a>
    ${runURL ? `<div style="margin-top:12px;font-size:13px;"><a href="${runURL}" style="color:#0066cc;">GitHub Actions run</a></div>` : ''}
  </td></tr>
</table>
<div style="font-size:12px;color:#6e6e73;padding:16px;">Sent by the daily GitHub Actions run for selenium-automation.com.</div>
</td></tr></table></body></html>`;

// ---- Write ---------------------------------------------------------------------------------

mkdirSync(site, { recursive: true });
for (const suite of suites) {
  const report = join(inputs, suite.key, 'playwright-report');
  if (existsSync(report)) cpSync(report, join(site, suite.key), { recursive: true });
}
const jmeterReport = join(inputs, 'jmeter', 'tests', 'jmeter', 'results', 'report');
if (existsSync(jmeterReport)) cpSync(jmeterReport, join(site, 'jmeter'), { recursive: true });
writeFileSync(join(site, 'index.html'), dashboard);
writeFileSync(join(site, 'history.json'), JSON.stringify(history, null, 2));
// Jekyll would hide the reports' _-prefixed folders.
writeFileSync(join(site, '.nojekyll'), '');
writeFileSync(join(inputs, 'email.html'), email);
writeFileSync(join(inputs, 'email-subject.txt'), `${allPassed ? '✅' : '❌'} ${headline} · ${shortDay}`);
console.log(`${allPassed ? 'PASSED' : 'FAILED'}: ${headline}`);
