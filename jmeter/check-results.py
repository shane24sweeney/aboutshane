"""Fails when any JMeter sample failed. JMeter itself exits 0 even when assertions fail."""

import csv
import os
import sys
from collections import defaultdict

results = sys.argv[1] if len(sys.argv) > 1 else 'jmeter/results/results.jtl'

totals = defaultdict(lambda: {'count': 0, 'failed': 0, 'elapsed': []})
failures = []
with open(results, newline='') as jtl:
    for row in csv.DictReader(jtl):
        label = totals[row['label']]
        label['count'] += 1
        label['elapsed'].append(int(row['elapsed']))
        if row['success'] != 'true':
            label['failed'] += 1
            failures.append(f"{row['label']}: {row['responseCode']} {row['failureMessage'] or row['responseMessage']}")

lines = ['| Button | Samples | Failed | Median ms | Max ms |', '|---|---:|---:|---:|---:|']
for name, label in totals.items():
    elapsed = sorted(label['elapsed'])
    lines.append(f"| {name} | {label['count']} | {label['failed']} | {elapsed[len(elapsed) // 2]} | {elapsed[-1]} |")
summary = '\n'.join(lines)
print(summary)

if 'GITHUB_STEP_SUMMARY' in os.environ:
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as out:
        out.write('## JMeter button clicks\n\n' + summary + '\n')

if not totals:
    sys.exit('No samples recorded')
if failures:
    print(f'\n{len(failures)} failed samples:', *sorted(set(failures)), sep='\n  ')
    sys.exit(1)
