import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, vi } from 'vitest';

// jsdom can't draw a Leaflet map, so pages render a stand-in for it. The grouping into pins is
// tested on its own (raceLocations.test.ts), and the real map in the Playwright tests.
vi.mock('../../frontend/src/components/RaceMap', () => ({
  default: ({ races }: { races: unknown[] }) => createElement('div', { 'data-testid': 'race-map' }, `${races.length} races on the map`),
}));

// jsdom has no WebGL, so the Metrics page's 3D chart is a stand-in here and real in Playwright.
vi.mock('../../frontend/src/components/TestGrid3D', () => ({
  default: ({ grid }: { grid: { rows: unknown[] } }) => createElement('div', { 'data-testid': 'test-grid-3d' }, `${grid.rows.length} rows in 3D`),
}));

vi.mock('../../frontend/src/components/VisitorGlobe3D', () => ({
  default: ({ countries }: { countries: unknown[] }) => createElement('div', { 'data-testid': 'visitor-globe' }, `${countries.length} countries on the globe`),
}));

beforeEach(() => {
  // No network in unit tests: the content API is "down" unless a test stubs fetch itself,
  // so pages render their bundled fallback content.
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
