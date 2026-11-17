import running from '../../../content/running.json' with { type: 'json' };

/**
 * The running stats worked out independently of the Java API, as a test oracle. The local fixture
 * serves these in place of GET /api/content/running/stats, and tests compare the page against them.
 */
type Race = (typeof running.races)[number];

export function raceMiles(distance: string): number {
  const label = distance.toLowerCase();
  if (label.includes('half marathon')) return 13.1094;
  const km = /(\d+(?:\.\d+)?)\s*k\b/.exec(label);
  if (km) return Number(km[1]) * 0.621371;
  const mi = /(\d+(?:\.\d+)?)\s*(?:mi|mile|miles)\b/.exec(label);
  if (mi) return Number(mi[1]);
  throw new Error(`No distance in race label: ${distance}`);
}

export function raceSeconds(time: string): number {
  const parts = time.split(':').map(Number);
  return parts.length === 3 ? parts[0]! * 3600 + parts[1]! * 60 + parts[2]! : parts[0]! * 60 + parts[1]!;
}

const round = (value: number) => Math.round(value * 10) / 10;
const hms = (seconds: number) =>
  `${Math.floor(seconds / 3600)}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export function expectedRunningStats(races: Race[] = running.races) {
  const fastest = new Map<string, Race>();
  for (const race of races) {
    const best = fastest.get(race.distance);
    if (!best || raceSeconds(race.time) < raceSeconds(best.time)) fastest.set(race.distance, race);
  }
  const years = races.map((race) => Number(race.date.slice(0, 4)));
  return {
    races: races.length,
    firstYear: Math.min(...years),
    lastYear: Math.max(...years),
    totalMiles: round(races.reduce((sum, race) => sum + raceMiles(race.distance), 0)),
    totalTime: hms(races.reduce((sum, race) => sum + raceSeconds(race.time), 0)),
    personalBests: [...fastest.values()]
      .map(({ distance, time, pace, event, date }) => ({ distance, miles: round(raceMiles(distance)), time, pace, event, date }))
      .sort((a, b) => a.miles - b.miles || a.distance.localeCompare(b.distance)),
  };
}
