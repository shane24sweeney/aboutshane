import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from '../../frontend/src/App';
import { fallbackContent } from '../../frontend/src/content/fallback';
import { formatRaceDate } from '../../frontend/src/content/raceDate';

describe('running page', () => {
  it('formats race dates without shifting the day for the visitor time zone', () => {
    expect(formatRaceDate('2025-11-27')).toBe('Nov 27, 2025');
    expect(formatRaceDate('2019-12-01')).toBe('Dec 1, 2019');
  });

  it('lists every race newest first with its time and overall place', async () => {
    render(
      <MemoryRouter initialEntries={['/running']}>
        <App />
      </MemoryRouter>,
    );

    const table = await screen.findByRole('table', { name: 'Race results' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(fallbackContent.running.races.length);

    const [newest] = fallbackContent.running.races;
    expect(within(rows[0]!).getByText(newest!.event)).toBeInTheDocument();
    expect(within(rows[0]!).getByText(newest!.time)).toBeInTheDocument();
    expect(within(rows[0]!).getByText(`${newest!.place.toLocaleString('en-US')} of ${newest!.finishers.toLocaleString('en-US')}`)).toBeInTheDocument();
  });

  it('links to the full results on Athlinks in a new tab', async () => {
    render(
      <MemoryRouter initialEntries={['/running']}>
        <App />
      </MemoryRouter>,
    );

    // react-bootstrap renders <Button href> as an anchor with role="button", as on the charity page.
    const link = await screen.findByRole('button', { name: fallbackContent.running.profile.label });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', fallbackContent.running.profile.href);
    expect(link).toHaveAttribute('target', '_blank');
  });
});
