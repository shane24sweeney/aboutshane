// Adds up the UI's code coverage from the unit tests (Vitest: coverage/coverage-final.json) and from
// the browser tests (Playwright on the coverage build: coverage-browser/*.json), writes the combined
// report to coverage-combined/, and fails when it falls below the thresholds in ./thresholds.json.
//
//   npm run test:coverage && npm run test:coverage:browser && npm run coverage:merge
//
// Both sides are instrumented by Istanbul. The browser's numbers are recorded against the built
// JavaScript, so they're first mapped back to the TypeScript source with the build's source maps,
// then each statement, function and branch is matched to the unit-test map by where it starts in the
// source (the two tools record some end columns differently) and its hits are added on.

import { existsSync, readdirSync, readFileSync, appendFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import libCoverage from 'istanbul-lib-coverage';
import libReport from 'istanbul-lib-report';
import libSourceMaps from 'istanbul-lib-source-maps';
import reports from 'istanbul-reports';

const root = fileURLToPath(new URL('../../', import.meta.url));
const thresholds = JSON.parse(readFileSync(new URL('./thresholds.json', import.meta.url), 'utf8'));
const out = resolve(root, 'coverage-combined');

/** Coverage keyed by absolute path, whichever form the instrumenter wrote. */
function normalised(data) {
  const map = {};
  for (const [key, file] of Object.entries(data)) {
    const path = isAbsolute(file.path ?? key) ? (file.path ?? key) : resolve(root, file.path ?? key);
    map[path] = { ...file, path };
  }
  return map;
}

const at = (loc) => `${loc.start.line}:${loc.start.column}`;

/** Adds `extra`'s hits onto `base` (both plain Istanbul file coverage for the same source file). */
function addHits(base, extra) {
  const index = (entries, key) => new Map(Object.entries(entries).map(([id, entry]) => [key(entry), id]));
  const statements = index(base.statementMap, at);
  for (const [id, loc] of Object.entries(extra.statementMap)) {
    const match = statements.get(at(loc));
    if (match !== undefined) base.s[match] += extra.s[id];
  }
  const functions = index(base.fnMap, (fn) => at(fn.decl ?? fn.loc));
  for (const [id, fn] of Object.entries(extra.fnMap)) {
    const match = functions.get(at(fn.decl ?? fn.loc));
    if (match !== undefined) base.f[match] += extra.f[id];
  }
  const branches = index(base.branchMap, (b) => `${b.type}@${at(b.loc)}`);
  for (const [id, branch] of Object.entries(extra.branchMap)) {
    const match = branches.get(`${branch.type}@${at(branch.loc)}`);
    if (match === undefined || base.b[match].length !== extra.b[id].length) continue;
    extra.b[id].forEach((hits, path) => (base.b[match][path] += hits));
  }
}

const merged = {};
const sources = [];
const unit = resolve(root, 'coverage/coverage-final.json');
if (existsSync(unit)) {
  Object.assign(merged, normalised(JSON.parse(readFileSync(unit, 'utf8'))));
  sources.push('unit tests');
}
const browserDir = resolve(root, 'coverage-browser');
const browserFiles = existsSync(browserDir) ? readdirSync(browserDir).filter((f) => f.endsWith('.json')) : [];
if (browserFiles.length) {
  const raw = libCoverage.createCoverageMap({});
  for (const name of browserFiles) raw.merge(JSON.parse(readFileSync(resolve(browserDir, name), 'utf8')));
  const remapped = await libSourceMaps.createSourceMapStore().transformCoverage(raw);
  const plain = Object.fromEntries(remapped.files().map((path) => [path, remapped.fileCoverageFor(path).toJSON()]));
  for (const [path, file] of Object.entries(normalised(plain))) {
    if (merged[path]) addHits(merged[path], file);
    else merged[path] = file;
  }
  sources.push(`${browserFiles.length} browser test snapshots`);
}
const map = libCoverage.createCoverageMap(merged);
if (!sources.length) {
  console.error('No coverage found: run `npm run test:coverage` and/or `npm run test:coverage:browser` first.');
  process.exit(1);
}

// Only the site's own source counts (not test helpers or node_modules).
map.filter((path) => relative(root, path).startsWith('frontend/src/') && !thresholds.ignore.includes(relative(root, path)));

const context = libReport.createContext({ dir: out, coverageMap: map, defaultSummarizer: 'nested' });
for (const name of ['html', 'json', 'json-summary', 'lcovonly']) reports.create(name).execute(context);

const summary = map.getCoverageSummary();
const pct = (metric) => summary[metric].pct;
const failures = [];
for (const [metric, minimum] of Object.entries(thresholds.global)) {
  if (pct(metric) < minimum) failures.push(`UI overall ${metric}: ${pct(metric)}% (needs ${minimum}%)`);
}
const rows = [];
for (const path of map.files().sort()) {
  const file = relative(root, path);
  const s = map.fileCoverageFor(path).toSummary();
  const rule = thresholds.files.find((r) => new RegExp(r.pattern).test(file));
  rows.push(`| ${file} | ${s.lines.pct}% | ${s.branches.pct}% |${rule ? ` ${rule.lines}% lines` : ''}`);
  if (rule && s.lines.pct < rule.lines) {
    const missed = Object.entries(map.fileCoverageFor(path).getLineCoverage()).filter(([, hits]) => !hits).map(([line]) => line);
    failures.push(`${file} lines: ${s.lines.pct}% (needs ${rule.lines}%; not run: ${missed.join(', ')})`);
  }
}

const table = ['| File | Lines | Branches | Rule', '|---|---:|---:|---|', ...rows].join('\n');
const headline = `UI coverage from ${sources.join(' and ')}: ${pct('lines')}% of lines, ${pct('branches')}% of branches, ${pct('functions')}% of functions`;
console.log(`${headline}\n\n${table}\n\nReport: coverage-combined/index.html`);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## ${headline}\n\n${table}\n`);

if (failures.length) {
  console.error(`\nCoverage is below the minimum:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
