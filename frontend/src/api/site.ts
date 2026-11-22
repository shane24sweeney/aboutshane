// Site search and status, from the API (backend: search/SearchController, status/StatusController).

export const SEARCH_MIN = 2;
export const SEARCH_MAX = 100;

export interface SearchResult {
  page: string;
  path: string;
  title: string;
  snippet: string;
  /** Where each matched word sits in the snippet. */
  highlights: { start: number; length: number }[];
}

export interface SearchResponse {
  query: string;
  count: number;
  results: SearchResult[];
}

export async function searchSite(query: string, signal?: AbortSignal): Promise<SearchResponse> {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`GET /api/search returned ${response.status}`);
  const body = (await response.json()) as SearchResponse;
  if (!Array.isArray(body?.results)) throw new Error('GET /api/search returned unexpected data');
  return body;
}

export interface SiteStatus {
  status: string;
  version: string;
  startedAt: string;
  uptimeSeconds: number;
  runtime: string;
  quality?: { status: 'healthy' | 'attention' | 'incomplete'; statusText: string; headline: string; day: string } | null;
}

export async function fetchStatus(signal?: AbortSignal): Promise<SiteStatus> {
  const response = await fetch('/api/status', { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`GET /api/status returned ${response.status}`);
  const body = (await response.json()) as SiteStatus;
  if (body?.status !== 'ok') throw new Error('GET /api/status returned unexpected data');
  return body;
}

/** The résumé PDF, built by the API from the Resume page's content. */
export const RESUME_PDF = '/api/resume.pdf';
