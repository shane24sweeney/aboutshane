import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import PageLoading from '../components/PageLoading';
import RaceMap from '../components/RaceMap';
import { formatIsoDate } from '../content/dates';
import { usePageContent } from '../hooks/usePageContent';
import { useRunningStats } from '../hooks/useRunningStats';
import type { RunningStats } from '../content/types';
import './Running.css';

/** "24 races · 2009 – 2025", from the newest-first race list. */
function raceSummary(races: { date: string }[]) {
  if (races.length === 0) return '';
  const newest = races[0]!.date.slice(0, 4);
  const oldest = races[races.length - 1]!.date.slice(0, 4);
  const years = newest === oldest ? newest : `${oldest} – ${newest}`;
  return `${races.length} ${races.length === 1 ? 'race' : 'races'} · ${years}`;
}

/** Totals and personal bests from GET /api/content/running/stats. */
function PersonalBests({ stats }: { stats: RunningStats }) {
  return (
    <section className="running-stats" aria-labelledby="running-bests-heading">
      <p className="running-totals">
        {stats.totalMiles.toLocaleString('en-US')} race miles · {stats.totalTime} racing
      </p>
      <h2 id="running-bests-heading">Personal bests</h2>
      <ul className="running-bests">
        {stats.personalBests.map(({ distance, time, pace, event, date }) => (
          <li key={distance}>
            <span className="running-best-distance">{distance}</span>
            <span className="running-best-time">{time}</span>
            <span className="running-best-detail">
              {pace} /mi · {event}, <time dateTime={date}>{formatIsoDate(date)}</time>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Running() {
  const content = usePageContent('running');
  const stats = useRunningStats();

  return (
    <section id="running" className="carousel-page running-page">
      <h1>Running</h1>
      {content.status === 'loading' || stats === undefined ? (
        <PageLoading />
      ) : (
        <div className="carousel-card running-card">
          <p className="running-summary">{raceSummary(content.data.races)}</p>
          <p className="running-intro">{content.data.intro}</p>
          {stats && stats.personalBests.length > 0 && <PersonalBests stats={stats} />}
          <RaceMap races={content.data.races} />
          <Table className="running-table" aria-label="Race results">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Race</th>
                <th scope="col">Distance</th>
                <th scope="col">Time</th>
                <th scope="col">Pace</th>
                <th scope="col">Overall</th>
              </tr>
            </thead>
            <tbody>
              {content.data.races.map(({ date, event, location, distance, time, pace, place, finishers }) => (
                <tr key={`${date}-${event}`}>
                  <td className="running-date" data-label="Date">
                    <time dateTime={date}>{formatIsoDate(date)}</time>
                  </td>
                  <td className="running-race" data-label="Race">
                    <span className="running-event">{event}</span>
                    <span className="running-location">{location}</span>
                  </td>
                  <td data-label="Distance">{distance}</td>
                  <td className="running-time" data-label="Time">{time}</td>
                  <td data-label="Pace">{pace} /mi</td>
                  <td data-label="Overall">
                    {place.toLocaleString('en-US')} of {finishers.toLocaleString('en-US')}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Button
            variant="success"
            href={content.data.profile.href}
            target="_blank"
            rel="noreferrer"
            className="rounded-pill running-profile"
          >
            {content.data.profile.label}
          </Button>
        </div>
      )}
    </section>
  );
}

export default Running;
