#!/usr/bin/env bash
# Downloads a GitHub Actions run's test reports and opens its Playwright report.
#
#   npm run debug:ci              # latest failed run on the current branch
#   npm run debug:ci -- <run-id>  # a specific run (the number in the run's URL)
#
# Needs the GitHub CLI (`gh`), signed in. Files land in tests/debugging/ci-artifacts/<run-id>/,
# which git ignores.
set -euo pipefail

run_id="${1:-}"
if [[ -z "$run_id" ]]; then
  branch="$(git branch --show-current)"
  run_id="$(gh run list --branch "$branch" --status failure --limit 1 --json databaseId -q '.[0].databaseId')"
  if [[ -z "$run_id" ]]; then
    echo "No failed runs on $branch. Pass a run id: npm run debug:ci -- <run-id>"
    exit 1
  fi
fi

out="tests/debugging/ci-artifacts/$run_id"
rm -rf "$out"
mkdir -p "$out"

gh run view "$run_id" --json workflowName,headBranch,conclusion,url \
  -q '"\(.workflowName) on \(.headBranch): \(.conclusion)\n\(.url)"'
echo
gh run view "$run_id" --log-failed | tail -n 40 || true
echo
gh run download "$run_id" --dir "$out"
echo "Downloaded to $out:"
ls "$out"

if [[ -d "$out/jmeter-report" ]]; then
  jmeter_report="$(find "$out/jmeter-report" -path '*/report/index.html' | head -n 1)"
  [[ -n "$jmeter_report" ]] && echo "JMeter report: open $jmeter_report"
fi

for artifact in playwright-report production-smoke-report browserstack-report; do
  report="$out/$artifact/playwright-report"
  if [[ -f "$report/index.html" ]]; then
    echo "Opening the Playwright report from $artifact (Ctrl+C to stop)"
    exec npx playwright show-report "$report"
  fi
done
echo "This run has no Playwright report; see the downloaded files above."
