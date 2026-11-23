import type { VisitorStats } from '../api/visitors';

// What the Site analytics molecule shows (components/VisitorMolecule3D.tsx), worked out from the
// visitor export, apart from the drawing so it can be tested on its own.

/** One atom: what it stands for, its size (0 to 1) and the numbers its tooltip shows. */
export interface Atom {
  name: string;
  detail: string;
  size: number;
}

/** The three clusters around the site, each its own colour (violet, pink, blue). */
export const CLUSTERS = [
  { key: 'pages', label: 'Pages', colour: '#b48cff' },
  { key: 'countries', label: 'Countries', colour: '#ff7eb6' },
  { key: 'speed', label: 'Speed', colour: '#6fa8ff' },
] as const;
export const NUCLEUS = '#f3ecff';
export const BOND = '#7d6aa8';

export const number = (n: number) => n.toLocaleString('en-US');

/** The clusters' atoms, largest first, from the visitor export. */
export function atomsFor(stats: VisitorStats): Record<(typeof CLUSTERS)[number]['key'], Atom[]> {
  const scale = (values: number[]) => {
    const most = Math.max(1, ...values);
    return (n: number) => Math.sqrt(n / most);
  };
  const pages = [...stats.pages].sort((a, b) => b.views - a.views).slice(0, 10);
  const pageSize = scale(pages.map((p) => p.views));
  const countries = [...stats.countries].sort((a, b) => b.users - a.users).slice(0, 12);
  const countrySize = scale(countries.map((c) => c.users));

  const speed: Atom[] = [];
  const vitals = stats.speed.realUsers ?? {};
  for (const [key, vital] of Object.entries(vitals)) {
    if (vital) speed.push({ name: key, detail: key === 'CLS' ? `${vital.average.toFixed(2)} average` : `${number(vital.average)} ms average`, size: 0.55 });
  }
  if (stats.speed.api?.p50 != null) speed.push({ name: 'API', detail: `${number(stats.speed.api.p50)} ms typical response`, size: 0.55 });
  if (stats.speed.load?.median != null) speed.push({ name: 'Under load', detail: `${number(stats.speed.load.median)} ms typical (JMeter)`, size: 0.55 });

  return {
    pages: pages.map((p) => ({ name: p.path, detail: `${number(p.views)} ${p.views === 1 ? 'view' : 'views'}`, size: pageSize(p.views) })),
    countries: countries.map((c) => ({ name: c.name, detail: `${number(c.users)} ${c.users === 1 ? 'visitor' : 'visitors'}`, size: countrySize(c.users) })),
    speed,
  };
}

