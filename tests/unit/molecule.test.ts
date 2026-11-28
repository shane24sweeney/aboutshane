import { describe, expect, it } from 'vitest';
import type { VisitorStats } from '../../frontend/src/api/visitors';
import { atomsFor, CLUSTERS } from '../../frontend/src/components/molecule';
import sample from '../e2e/support/visitors.sample.json';

const stats = sample as VisitorStats;

describe('the Site analytics molecule', () => {
  it('has pages, countries, speed, sources and devices clusters, each its own colour', () => {
    expect(CLUSTERS.map((c) => c.label)).toEqual(['Pages', 'Countries', 'Speed', 'Sources', 'Devices']);
    expect(new Set(CLUSTERS.map((c) => c.colour)).size).toBe(5);
  });

  it('shows how people arrive, and their devices then top browsers, sized by their numbers', () => {
    const { sources, devices } = atomsFor(stats);
    expect(sources.map((s) => s.name)).toEqual(['Direct', 'Organic Search', 'Organic Social', 'Referral']);
    expect(sources[0]).toMatchObject({ detail: '41 visits', size: 1 });
    expect(devices.map((d) => d.name)).toEqual(['Desktop', 'Phone', 'smart tv', 'Chrome', 'Safari', 'Edge']);
    expect(devices[0]!.detail).toBe('20 visitors on this device');
    expect(devices[2]!.detail).toBe('1 visitor on this device');
    expect(devices[3]!.detail).toBe('17 visitors on this browser');
  });

  it('sizes atoms by their numbers, the biggest full size, largest first', () => {
    const { pages, countries } = atomsFor(stats);
    expect(pages[0]).toMatchObject({ name: '/home', detail: '1,120 views', size: 1 });
    expect(countries[0]).toMatchObject({ name: 'United States', detail: '412 visitors', size: 1 });
    // area-like scaling: a quarter of the visitors gives half the size
    const india = countries.find((c) => c.name === 'India')!;
    expect(india.size).toBeCloseTo(Math.sqrt(61 / 412), 5);
    expect(pages.map((p) => p.size)).toEqual([...pages.map((p) => p.size)].sort((a, b) => b - a));
  });

  it('shows at most 10 pages and 12 countries', () => {
    const many = {
      ...stats,
      pages: Array.from({ length: 15 }, (_, i) => ({ path: `/p${i}`, views: i + 1 })),
      countries: Array.from({ length: 20 }, (_, i) => ({ code: `C${i}`, name: `Country ${i}`, users: i + 1, sessions: 1 })),
    };
    const { pages, countries } = atomsFor(many);
    expect(pages).toHaveLength(10);
    expect(pages[0]!.name).toBe('/p14');
    expect(countries).toHaveLength(12);
  });

  it('lists every speed measure that has a number, with its unit', () => {
    const speed = atomsFor(stats).speed;
    expect(speed.map((s) => s.name)).toEqual(['LCP', 'INP', 'CLS', 'FCP', 'TTFB', 'API', 'Under load']);
    expect(speed.find((s) => s.name === 'CLS')!.detail).toBe('0.02 average');
    expect(speed.find((s) => s.name === 'LCP')!.detail).toBe('1,840 ms average');
    expect(speed.find((s) => s.name === 'API')!.detail).toBe('24 ms typical response');
  });

  it('says "1 view" and "1 visitor", and leaves out speed that has no numbers yet', { tags: ['negative'] }, () => {
    const quiet = {
      ...stats,
      pages: [{ path: '/home', views: 1 }],
      countries: [{ code: 'IE', name: 'Ireland', users: 1, sessions: 1 }],
      speed: { realUsers: null, api: { days: 30, p50: null, p90: null, p99: null, requests: 0 }, load: null },
    };
    const atoms = atomsFor(quiet);
    expect(atoms.pages[0]!.detail).toBe('1 view');
    expect(atoms.countries[0]!.detail).toBe('1 visitor');
    expect(atoms.speed).toEqual([]);
    expect(atomsFor({ ...quiet, pages: [], countries: [] }).pages).toEqual([]);
    expect(atomsFor({ ...quiet, audience: undefined })).toMatchObject({ sources: [], devices: [] });
    expect(atomsFor({ ...quiet, audience: { ...quiet.audience!, channels: [{ name: 'Referral', sessions: 1 }] } }).sources[0]!.detail).toBe('1 visit');
  });
});
