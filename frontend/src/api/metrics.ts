// The daily quality report's numbers, published by scripts/test-report/build.mjs to GitHub Pages
// as metrics.json. GitHub Pages allows any site to read it, so the Metrics page fetches it
// directly and always shows the latest run without a redeploy.

export const REPORT_URL = 'https://shane24sweeney.github.io/aboutshane/';
export const METRICS_URL = `${REPORT_URL}metrics.json`;
export const METRICS_TIMEOUT_MS = 8000;

export type Status = 'passed' | 'failed' | 'flaky' | 'skipped';
export type Counts = Partial<Record<Status, number>>;

export interface Coverage {
  lines: number;
  branches: number;
  functions: number;
  linesCovered: number;
  linesTotal: number;
}

export interface DevSuite {
  totals: Counts;
  total: number;
  duration: number;
  files: number;
  coverage: Coverage | null;
}

export interface PlaywrightSuite {
  totals: Counts;
  total: number;
  duration: number;
  devices: number;
}

export interface LoadAction {
  action: string;
  samples: number;
  failed: number;
  median: number;
  p95: number;
}

export interface GridCell extends Required<Counts> {
  /** Relative to the report site. */
  link: string;
  /** Each test: its name and result. */
  tests: { t: string; s: Status }[];
}

export interface Metrics {
  version: number;
  generatedAt: string;
  day: string;
  status: 'healthy' | 'attention' | 'incomplete';
  statusText: string;
  headline: string;
  summary: string;
  reportUrl: string;
  runUrl: string;
  kpis: { label: string; value: string; sub: string; tone?: 'good' | 'bad' }[];
  overall: Counts;
  development: { ui: DevSuite | null; api: DevSuite | null };
  qa: {
    regression: PlaywrightSuite | null;
    smoke: PlaywrightSuite | null;
    load: { samples: number; failed: number; median: number | null; p95: number | null; duration: number; actions: LoadAction[] } | null;
  };
  failures: { area: string; title: string; device: string; error: string }[];
  devices: { device: string; regression: DeviceCounts | null; smoke: DeviceCounts | null }[];
  delivery: {
    days: number;
    mergedPullRequests: number;
    commits: number;
    ciRuns: number;
    ciPassed: number;
    weeks: { start: string; end: string; merged: number }[];
  } | null;
  history: { date: string; status: 'healthy' | 'attention' | 'incomplete'; checks: number | null }[];
  grid: { rows: { name: string }[]; columns: { name: string }[]; cells: Record<string, GridCell> };
}

export interface DeviceCounts {
  passed: number;
  failed: number;
  flaky: number;
}

export async function fetchMetrics(signal?: AbortSignal): Promise<Metrics> {
  const response = await fetch(METRICS_URL, { signal, cache: 'no-cache' });
  if (!response.ok) throw new Error(`metrics.json: ${response.status}`);
  const metrics = (await response.json()) as Metrics;
  if (metrics.version !== 1 || !metrics.grid) throw new Error('metrics.json: unexpected format');
  return metrics;
}

/** "Sat, Nov 21, 3:04 PM (2 hours ago)" in the visitor's own time zone. */
export function updatedAt(iso: string, now = Date.now()) {
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return '';
  const minutes = Math.max(0, Math.round((now - when.getTime()) / 60_000));
  const ago =
    minutes < 1 ? 'just now' : minutes < 60 ? `${minutes} min ago` : minutes < 48 * 60 ? `${Math.round(minutes / 60)} h ago` : `${Math.round(minutes / 1440)} days ago`;
  const stamp = when.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  return `${stamp} (${ago})`;
}
