import { appendFileSync } from 'node:fs';
import { relative } from 'node:path';
import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';

/**
 * Writes the run's totals and every failed or flaky test to the GitHub Actions job summary, so
 * failures are visible on the run page without downloading the report. No-op outside Actions.
 */
export default class GitHubSummaryReporter implements Reporter {
  private readonly results = new Map<TestCase, TestResult>();

  onTestEnd(test: TestCase, result: TestResult) {
    // Keep the last attempt; retries end here too.
    this.results.set(test, result);
  }

  onEnd(result: FullResult) {
    const summaryFile = process.env.GITHUB_STEP_SUMMARY;
    if (!summaryFile) return;

    const tests = [...this.results.keys()];
    const count = (outcome: ReturnType<TestCase['outcome']>) => tests.filter((test) => test.outcome() === outcome).length;
    const problems = tests.filter((test) => test.outcome() === 'unexpected' || test.outcome() === 'flaky');

    const lines = [
      `## Playwright: ${result.status === 'passed' ? 'passed' : 'FAILED'}`,
      '',
      `${count('expected')} passed · ${count('unexpected')} failed · ${count('flaky')} flaky · ${count('skipped')} skipped`,
      '',
    ];
    if (problems.length > 0) {
      lines.push('| Result | Project | Test | Location | Error |', '|---|---|---|---|---|');
      for (const test of problems) {
        const [, project, , ...title] = test.titlePath();
        const location = `${relative(process.cwd(), test.location.file)}:${test.location.line}`;
        const error = firstLine(this.results.get(test)?.error?.message);
        lines.push(`| ${test.outcome() === 'flaky' ? 'flaky' : 'failed'} | ${project} | ${cell(title.join(' › '))} | \`${location}\` | ${cell(error)} |`);
      }
      lines.push('', 'Traces and screenshots are in the run\'s report artifacts.');
    }
    appendFileSync(summaryFile, lines.join('\n') + '\n\n');
  }

  printsToStdio() {
    return false;
  }
}

function firstLine(message = '') {
  // eslint-disable-next-line no-control-regex
  return message.replace(/\u001b\[[0-9;]*m/g, '').split('\n').find((line) => line.trim()) ?? '';
}

function cell(text: string) {
  return text.replace(/\|/g, '\\|').slice(0, 200);
}
