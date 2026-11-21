// Readers for the development half of the quality report: UI unit tests (Vitest), API tests
// (JUnit via Maven Surefire), code coverage for both, and delivery numbers from GitHub.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const counts = () => ({ passed: 0, failed: 0, skipped: 0 });

// Vitest's JSON reporter (test-results/unit.json) and coverage/coverage-summary.json.
export function readUi(dir) {
  const file = join(dir, 'test-results', 'unit.json');
  if (!existsSync(file)) return null;
  const json = JSON.parse(readFileSync(file, 'utf8'));
  const totals = counts();
  const files = [];
  const failures = [];
  let duration = 0;
  for (const result of json.testResults) {
    const fileCounts = { name: basename(result.name).replace(/\.test\.tsx?$/, ''), ...counts(), tests: [] };
    duration += (result.endTime ?? 0) - (result.startTime ?? 0);
    for (const test of result.assertionResults) {
      const outcome = test.status === 'passed' ? 'passed' : test.status === 'failed' ? 'failed' : 'skipped';
      totals[outcome] += 1;
      fileCounts[outcome] += 1;
      fileCounts.tests.push({ t: test.fullName ?? test.title, s: outcome });
      if (outcome === 'failed') {
        failures.push({ area: `UI unit tests (${fileCounts.name})`, title: test.title, error: (test.failureMessages ?? [])[0]?.split('\n')[0] ?? 'Failed' });
      }
    }
    files.push(fileCounts);
  }
  const summaryFile = join(dir, 'coverage', 'coverage-summary.json');
  const coverage = existsSync(summaryFile)
    ? (({ lines, branches, functions }) => ({ lines: lines.pct, branches: branches.pct, functions: functions.pct, linesCovered: lines.covered, linesTotal: lines.total }))(JSON.parse(readFileSync(summaryFile, 'utf8')).total)
    : null;
  return { totals, total: totals.passed + totals.failed + totals.skipped, files, failures, duration, coverage };
}

// Surefire XML reports and JaCoCo's jacoco.csv, from backend/target.
export function readApi(dir) {
  const reports = join(dir, 'surefire-reports');
  if (!existsSync(reports)) return null;
  const totals = counts();
  const files = [];
  const failures = [];
  let duration = 0;
  for (const name of readdirSync(reports).filter((f) => /^TEST-.*\.xml$/.test(f))) {
    const xml = readFileSync(join(reports, name), 'utf8');
    const suite = xml.match(/<testsuite\b[^>]*>/)?.[0] ?? '';
    duration += Number(suite.match(/\btime="([\d.]+)"/)?.[1] ?? 0) * 1000;
    const className = name.replace(/^TEST-/, '').replace(/\.xml$/, '').split('.').pop();
    const fileCounts = { name: className, ...counts(), tests: [] };
    // Each <testcase .../> or <testcase ...>...</testcase>, with any <failure>, <error> or <skipped> inside.
    for (const [, attrs, body = ''] of xml.matchAll(/<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g)) {
      const title = attrs.match(/\bname="([^"]*)"/)?.[1] ?? 'test';
      const outcome = /<(failure|error)\b/.test(body) ? 'failed' : /<skipped\b/.test(body) ? 'skipped' : 'passed';
      totals[outcome] += 1;
      fileCounts[outcome] += 1;
      fileCounts.tests.push({ t: title, s: outcome });
      if (outcome === 'failed') {
        const message = body.match(/<(?:failure|error)\b[^>]*\bmessage="([^"]*)"/)?.[1] ?? 'Failed';
        failures.push({ area: `API tests (${className})`, title, error: message.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') });
      }
    }
    files.push(fileCounts);
  }
  const csv = join(dir, 'site', 'jacoco', 'jacoco.csv');
  let coverage = null;
  if (existsSync(csv)) {
    const [header, ...rows] = readFileSync(csv, 'utf8').trim().split(/\r?\n/);
    const columns = header.split(',');
    const sum = (column) => rows.reduce((n, row) => n + Number(row.split(',')[columns.indexOf(column)]), 0);
    const pct = (covered, missed) => (covered + missed ? Math.round((covered / (covered + missed)) * 1000) / 10 : 0);
    coverage = {
      lines: pct(sum('LINE_COVERED'), sum('LINE_MISSED')),
      branches: pct(sum('BRANCH_COVERED'), sum('BRANCH_MISSED')),
      functions: pct(sum('METHOD_COVERED'), sum('METHOD_MISSED')),
      linesCovered: sum('LINE_COVERED'),
      linesTotal: sum('LINE_COVERED') + sum('LINE_MISSED'),
    };
  }
  return { totals, total: totals.passed + totals.failed + totals.skipped, files, failures, duration, coverage };
}

// delivery.json, written by delivery.mjs in the workflow.
export function readDelivery(file) {
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
}
