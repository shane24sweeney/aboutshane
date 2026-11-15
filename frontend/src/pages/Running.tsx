import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import PageLoading from '../components/PageLoading';
import { formatRaceDate } from '../content/raceDate';
import { usePageContent } from '../hooks/usePageContent';
import './Running.css';

function Running() {
  const content = usePageContent('running');

  return (
    <section id="running" className="carousel-page running-page">
      <h1>Running</h1>
      {content.status === 'loading' ? (
        <PageLoading />
      ) : (
        <div className="carousel-card running-card">
          <p className="running-intro">{content.data.intro}</p>
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
                    <time dateTime={date}>{formatRaceDate(date)}</time>
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
