// Visitors by country and the site's speed, from GET /api/visitors (exported daily from Google
// Analytics, CloudWatch and the load test by scripts/analytics/export.mjs).

export interface Vital {
  /** Milliseconds, except CLS (unitless). */
  average: number;
  samples: number;
}

export interface VisitorStats {
  version: 1;
  generatedAt: string;
  days: number;
  totals: { users: number; newUsers: number; sessions: number; pageViews: number; avgSessionSeconds: number };
  /** Share of visitors in the US, 0 to 1 (null if no country data). */
  usShare: number | null;
  countries: { code: string; name: string; users: number; sessions: number }[];
  pages: { path: string; views: number }[];
  daily: { date: string; users: number }[];
  speed: {
    realUsers: Partial<Record<'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB', Vital>> | null;
    api: { days: number; p50: number | null; p90: number | null; p99: number | null; requests: number } | null;
    load: { median: number | null; p95: number | null; requests: number } | null;
  };
}

export type VisitorsResponse = VisitorStats | { available: false; message: string };

export const isAvailable = (body: VisitorsResponse): body is VisitorStats => (body as VisitorStats).version === 1;

export async function fetchVisitors(signal?: AbortSignal): Promise<VisitorsResponse> {
  const response = await fetch('/api/visitors', { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`GET /api/visitors returned ${response.status}`);
  const body = (await response.json()) as VisitorsResponse;
  if (!isAvailable(body) && (body as { available?: boolean }).available !== false) throw new Error('GET /api/visitors returned unexpected data');
  return body;
}

/** Google's Core Web Vitals thresholds: good up to the first number, poor above the second. */
export const VITAL_THRESHOLDS = {
  LCP: [2500, 4000],
  INP: [200, 500],
  CLS: [0.1, 0.25],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
} as const;

export function vitalRating(name: keyof typeof VITAL_THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' {
  const [good, poor] = VITAL_THRESHOLDS[name];
  return value <= good ? 'good' : value <= poor ? 'needs-improvement' : 'poor';
}
