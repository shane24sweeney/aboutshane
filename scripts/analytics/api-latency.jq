# Turns CloudWatch's daily API Gateway latency datapoints into the Analytics tab's API numbers:
# total requests over the period, and p50/p90/p99 weighted by each day's requests.
# Input: `aws cloudwatch get-metric-statistics ... --statistics SampleCount --extended-statistics p50 p90 p99`.
.Datapoints as $days
| ($days | map(.SampleCount) | add // 0) as $requests
| def weighted($p): if $requests > 0 then ($days | map(.ExtendedStatistics[$p] * .SampleCount) | add / $requests | round) else null end;
{ days: 30, p50: weighted("p50"), p90: weighted("p90"), p99: weighted("p99"), requests: ($requests | round) }
