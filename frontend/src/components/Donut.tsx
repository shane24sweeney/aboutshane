import type { Counts, Status } from '../api/metrics';

const ORDER: Status[] = ['passed', 'failed', 'flaky', 'skipped'];
const NAMES: Record<Status, string> = { passed: 'Passed', failed: 'Failed', flaky: 'Flaky', skipped: 'Skipped' };

/** Share that passed, out of everything that ran (skipped tests didn't run). */
function passRate(counts: Counts): string {
  const ran = (counts.passed ?? 0) + (counts.failed ?? 0) + (counts.flaky ?? 0);
  if (!ran) return '–';
  const rate = (((counts.passed ?? 0) + (counts.flaky ?? 0)) / ran) * 100;
  return `${rate === 100 ? 100 : rate >= 99.95 ? 99.9 : rate.toFixed(1)}%`;
}

interface DonutProps {
  title: string;
  /** A line under the title, e.g. "665 tests · Desktop and 5 phones". */
  caption?: string;
  /** null when the suite has no results today. */
  counts: Counts | null;
  size?: number;
}

/**
 * A ring per result, with 2px gaps between slices and the pass rate in the middle. A non-zero slice
 * is drawn at least 4px long so one failure among hundreds is still visible; the legend gives the
 * exact counts, so colour is never the only cue.
 */
function Donut({ title, caption, counts, size = 132 }: DonutProps) {
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const centre = size / 2;

  if (!counts) {
    return (
      <figure className="donut">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${title}: no results today`}>
          <circle cx={centre} cy={centre} r={r} fill="none" className="donut-ring" strokeWidth={stroke} />
          <text x="50%" y={centre + 4} textAnchor="middle" className="donut-sub">No results</text>
        </svg>
        <figcaption>
          <strong>{title}</strong>
          <span>The run didn't finish today</span>
        </figcaption>
      </figure>
    );
  }

  const parts = ORDER.filter((s) => (counts[s] ?? 0) > 0).map((s) => [s, counts[s]!] as const);
  const total = parts.reduce((n, [, v]) => n + v, 0);
  const gap = parts.length > 1 ? 2 : 0;
  let lengths = parts.map(([, v]) => Math.max((v / total) * c, 4 + gap));
  const excess = lengths.reduce((a, b) => a + b, 0) - c;
  const largest = lengths.indexOf(Math.max(...lengths));
  lengths = lengths.map((len, i) => (i === largest ? len - excess : len));
  let offset = 0;
  const label = `${title}: ${ORDER.filter((s) => counts[s] !== undefined).map((s) => `${counts[s]} ${s}`).join(', ')}`;

  return (
    <figure className="donut">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
        <circle cx={centre} cy={centre} r={r} fill="none" className="donut-ring" strokeWidth={stroke} />
        {parts.map(([status], i) => {
          const length = lengths[i] ?? 0;
          const arc = (
            <circle
              key={status}
              cx={centre}
              cy={centre}
              r={r}
              fill="none"
              className={`donut-${status}`}
              strokeWidth={stroke}
              strokeDasharray={`${Math.max(length - gap, 0.5)} ${c}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${centre} ${centre})`}
            />
          );
          offset += length;
          return arc;
        })}
        <text x="50%" y={centre - 2} textAnchor="middle" className="donut-value">
          {passRate(counts)}
        </text>
        <text x="50%" y={centre + 17} textAnchor="middle" className="donut-sub">
          passed
        </text>
      </svg>
      <figcaption>
        <strong>{title}</strong>
        {caption && <span>{caption}</span>}
      </figcaption>
      <ul className="donut-legend">
        {ORDER.filter((s) => counts[s] !== undefined).map((s) => (
          <li key={s}>
            <i className={`swatch-${s}`} aria-hidden="true" />
            {NAMES[s]} <b>{counts[s]}</b>
          </li>
        ))}
      </ul>
    </figure>
  );
}

export default Donut;
