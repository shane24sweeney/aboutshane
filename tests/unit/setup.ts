import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, vi } from 'vitest';

// jsdom can't draw a Leaflet map, so pages render a stand-in for it. The grouping into pins is
// tested on its own (raceLocations.test.ts), and the real map in the Playwright tests.
vi.mock('../../frontend/src/components/RaceMap', () => ({
  default: ({ races }: { races: unknown[] }) => createElement('div', { 'data-testid': 'race-map' }, `${races.length} races on the map`),
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
