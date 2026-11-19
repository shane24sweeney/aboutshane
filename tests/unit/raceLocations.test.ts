import { groupByLocation } from '../../frontend/src/content/raceLocations';
import { fallbackContent } from '../../frontend/src/content/fallback';
import type { RaceResult } from '../../frontend/src/content/types';

const race = (event: string, location: string, lat = 34.77, lng = -84.97): RaceResult => ({
  date: '2024-01-01', event, location, lat, lng, distance: '5K', time: '30:00', pace: '9:40', place: 1, finishers: 10,
});

describe('race map pins', () => {
  it('gives each town one pin, listing its races in order', () => {
    const pins = groupByLocation([race('A', 'Dalton, GA'), race('B', 'Helen, GA', 34.7, -83.73), race('C', 'Dalton, GA')]);
    expect(pins.map(({ location, races }) => [location, races.map(({ event }) => event)])).toEqual([
      ['Dalton, GA', ['A', 'C']],
      ['Helen, GA', ['B']],
    ]);
  });

  it('puts every race on the map, with one pin per town', () => {
    const { races } = fallbackContent.running;
    const pins = groupByLocation(races);
    expect(pins).toHaveLength(new Set(races.map(({ location }) => location)).size);
    expect(pins.reduce((total, pin) => total + pin.races.length, 0)).toBe(races.length);
  });

  it('has no pins when there are no races', { tags: ['negative'] }, () => {
    expect(groupByLocation([])).toEqual([]);
  });
});
