import type { RaceResult } from './types';

/** A town on the race map and the races run there, newest first. */
export interface RaceLocation {
  location: string;
  lat: number;
  lng: number;
  races: RaceResult[];
}

/** One pin per town: races in the same place share a pin, in the order of the race list. */
export function groupByLocation(races: RaceResult[]): RaceLocation[] {
  const places = new Map<string, RaceLocation>();
  for (const race of races) {
    const place = places.get(race.location);
    if (place) place.races.push(race);
    else places.set(race.location, { location: race.location, lat: race.lat, lng: race.lng, races: [race] });
  }
  return [...places.values()];
}
