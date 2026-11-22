import { readFileSync } from 'node:fs';

// A small stand-in for GET /api/search in the local preview (which has no backend), over the same
// content/*.json files: every word must match, case-insensitively. The real ranking and snippets
// are tested in backend/src/test/java/.../search.

type Doc = { page: string; path: string; title: string; text: string };
const content = (name: string) => JSON.parse(readFileSync(new URL(`../../../content/${name}.json`, import.meta.url), 'utf8'));

function documents(): Doc[] {
  const docs: Doc[] = [];
  const profile = content('profile');
  profile.summary.forEach((text: string) => docs.push({ page: 'Home', path: '/home', title: profile.summaryTitle, text: text.replaceAll('**', '') }));
  profile.strengths.forEach((text: string) => docs.push({ page: 'Home', path: '/home', title: profile.strengthsTitle, text }));
  for (const entry of content('resume')) {
    const title = `${entry.role} - ${entry.company}`;
    entry.highlights.forEach((text: string) => docs.push({ page: 'Resume', path: '/resume', title, text }));
  }
  for (const t of content('testimonials')) docs.push({ page: 'Testimonials', path: '/testimonials', title: `${t.name}, ${t.title}`, text: t.recommendation });
  for (const race of content('running').races) {
    docs.push({ page: 'Running', path: '/running', title: race.event, text: `${race.date}, ${race.location}. ${race.distance} in ${race.time}.` });
  }
  return docs;
}

export function searchFixture(query: string) {
  const terms = [...new Set(query.toLowerCase().split(/[\s,;:.!?()"']+/).filter(Boolean))];
  const results = documents()
    .filter((d) => terms.every((t) => `${d.title} ${d.text}`.toLowerCase().includes(t)))
    .slice(0, 20)
    .map((d) => {
      const snippet = d.text.length > 160 ? `${d.text.slice(0, 159)}…` : d.text;
      const lower = snippet.toLowerCase();
      const highlights = terms.flatMap((t) => {
        const found: { start: number; length: number }[] = [];
        for (let at = lower.indexOf(t); at >= 0; at = lower.indexOf(t, at + t.length)) found.push({ start: at, length: t.length });
        return found;
      });
      return { page: d.page, path: d.path, title: d.title, snippet, highlights: highlights.sort((a, b) => a.start - b.start) };
    });
  return { query, count: results.length, results };
}

export const STATUS_FIXTURE = {
  status: 'ok',
  version: '1.0.0',
  builtAt: '2026-11-21T12:00:00Z',
  startedAt: '2026-11-21T12:01:00Z',
  uptimeSeconds: 120,
  runtime: 'Java 25',
  content: { pages: 7, resumeRoles: 8, testimonials: 12, races: 20 },
  quality: { status: 'healthy', statusText: 'Healthy', headline: 'All 973 checks passed', day: 'Saturday, November 21, 2026', reportUrl: 'https://shane24sweeney.github.io/aboutshane/' },
};

/** The smallest valid PDF, for the download test. */
export const PDF_FIXTURE = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
);
