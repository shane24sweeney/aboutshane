import type { ContentByPage, ContentPage } from '../content/types';

/** Give up on the API after this long and show the bundled copy instead (e.g. during a Lambda cold start). */
export const CONTENT_TIMEOUT_MS = 2500;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Cheap shape checks so a bad response falls back instead of crashing a page. */
const looksValid: { [P in ContentPage]: (value: unknown) => boolean } = {
  profile: (value) => isObject(value) && typeof value.name === 'string' && Array.isArray(value.strengths),
  about: (value) => isObject(value) && typeof value.essay === 'string',
  resume: (value) => Array.isArray(value) && value.every((entry) => isObject(entry) && Array.isArray(entry.highlights)),
  testimonials: (value) => Array.isArray(value) && value.every((entry) => isObject(entry) && typeof entry.name === 'string'),
  education: (value) => Array.isArray(value) && value.every((entry) => isObject(entry) && typeof entry.degree === 'string'),
  charity: (value) => Array.isArray(value) && value.every((entry) => isObject(entry) && typeof entry.title === 'string'),
};

export async function fetchContent<P extends ContentPage>(page: P, signal: AbortSignal): Promise<ContentByPage[P]> {
  const response = await fetch(`/api/content/${page}`, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`GET /api/content/${page} returned ${response.status}`);
  const body: unknown = await response.json();
  if (!looksValid[page](body)) throw new Error(`GET /api/content/${page} returned unexpected data`);
  return body as ContentByPage[P];
}
