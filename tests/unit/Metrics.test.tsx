import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { METRICS_URL, updatedAt } from '../../frontend/src/api/metrics';
import Metrics from '../../frontend/src/pages/Metrics';
import sample from '../e2e/support/metrics.sample.json';

function renderMetrics() {
  return render(
    <MemoryRouter initialEntries={['/metrics']}>
      <Metrics />
    </MemoryRouter>,
  );
}

const serve = (body: unknown, ok = true) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(body) }));

describe('Metrics page', () => {
  it('loads metrics.json from the daily report', async () => {
    serve(sample);
    renderMetrics();
    expect(await screen.findByRole('heading', { level: 2, name: sample.headline })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(METRICS_URL, expect.objectContaining({ cache: 'no-cache' }));
  });

  it('shows the verdict, headline numbers, and a donut per suite', async () => {
    serve(sample);
    renderMetrics();
    await screen.findByText(sample.summary);
    const kpis = screen.getByRole('list', { name: 'Headline numbers' });
    expect(within(kpis).getAllByRole('listitem')).toHaveLength(sample.kpis.length);
    for (const name of ['UI unit tests', 'API tests', 'Regression', 'Live site', 'Load (JMeter)']) {
      expect(screen.getByRole('img', { name: new RegExp(`^${name.replace(/[()]/g, '\\$&')}:`) })).toBeInTheDocument();
    }
    expect(screen.getByTestId('test-grid-3d')).toHaveTextContent(`${sample.grid.rows.length} rows in 3D`);
  });

  it('lists the individual tests behind a cell when it is selected', async () => {
    serve(sample);
    renderMetrics();
    await screen.findByText(sample.summary);
    const [key, cell] = Object.entries(sample.grid.cells)[0]!;
    const [r = 0, c = 0] = key.split('|').map(Number);
    const rowName = sample.grid.rows[r]!.name;
    const row = screen.getByRole('rowheader', { name: rowName }).closest('tr')!;
    fireEvent.click(within(row).getAllByRole('button')[0]!);
    const panel = screen.getByRole('region', { name: 'Selected tests' });
    expect(within(panel).getByRole('heading', { name: `${rowName} · ${sample.grid.columns[c]!.name}` })).toBeInTheDocument();
    expect(within(panel).getAllByRole('listitem')).toHaveLength(cell.tests.length);
    expect(within(panel).getByRole('link', { name: 'Open in the full report' })).toHaveAttribute('target', '_blank');
  });

  it('says so, with a link to the full report, when the metrics cannot be loaded', { tags: ['negative'] }, async () => {
    serve({}, false);
    renderMetrics();
    expect(await screen.findByRole('alert')).toHaveTextContent("Today's metrics couldn't be loaded");
    expect(screen.getByRole('link', { name: /shane24sweeney\.github\.io/ })).toBeInTheDocument();
  });

  it('rejects a metrics file in an unexpected format', { tags: ['negative'] }, async () => {
    serve({ version: 2 });
    renderMetrics();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('says when the shown results were produced, and how long ago', () => {
    const now = Date.parse('2026-11-21T17:04:00Z');
    expect(updatedAt('2026-11-21T15:04:00Z', now)).toMatch(/\(2 h ago\)$/);
    expect(updatedAt('2026-11-21T17:00:00Z', now)).toMatch(/\(4 min ago\)$/);
    expect(updatedAt('2026-11-18T17:04:00Z', now)).toMatch(/\(3 days ago\)$/);
    expect(updatedAt('not a date', now)).toBe('');
  });

  it('shows a fully green report over several days', async () => {
    const day = (date: string) => ({ date, status: 'healthy', checks: 10 });
    serve({
      ...sample,
      status: 'healthy',
      statusText: 'All passed',
      failures: [],
      runUrl: 'https://github.com/shane24sweeney/aboutshane/actions/runs/1',
      history: [day('2026-11-20'), day('2026-11-21'), day('2026-11-22')],
      qa: { ...sample.qa, load: { ...sample.qa.load!, actions: [{ action: 'Open site', samples: 9, failed: 2, median: 100, p95: 200 }] } },
    });
    renderMetrics();
    expect(await screen.findByText(/All passed/, { selector: '.metrics-pill' })).toHaveTextContent('✓');
    expect(screen.getByRole('heading', { name: 'Last 3 days' })).toBeInTheDocument();
    expect(screen.getByText(/3 of 3\s+days fully green/)).toBeInTheDocument();
    expect(screen.getByText('2 failed')).toBeInTheDocument();
    const run = 'https://github.com/shane24sweeney/aboutshane/actions/runs/1';
    expect(screen.getByRole('link', { name: "Today's GitHub Actions run" })).toHaveAttribute('href', run);
    expect(screen.getByRole('link', { name: 'see the run' })).toHaveAttribute('href', run);
  });

  it('still shows the page, with dashes, when some suites have no results', { tags: ['negative'] }, async () => {
    serve({
      ...sample,
      status: 'incomplete',
      statusText: 'Incomplete',
      generatedAt: 'not a date',
      reportUrl: '',
      runUrl: '',
      development: { ui: { ...sample.development.ui!, duration: 125_000, coverage: null }, api: null },
      qa: { regression: null, smoke: null, load: null },
      failures: [{ area: 'Build', title: 'UI build', device: 'Build', error: 'tsc failed' }],
      devices: [{ device: 'Desktop (Chrome)', regression: { passed: 3, failed: 0, flaky: 0 }, smoke: null }],
      delivery: null,
      grid: { ...sample.grid, cells: {} },
    });
    renderMetrics();
    expect(await screen.findByText(/Incomplete/, { selector: '.metrics-pill' })).toHaveTextContent('!');
    // the date it ran falls back to the day, the report link to the public report
    expect(screen.getByText(sample.day, { selector: 'time' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open the full quality report' })).toHaveAttribute('href', 'https://shane24sweeney.github.io/aboutshane/');
    expect(screen.queryByRole('link', { name: "Today's GitHub Actions run" })).not.toBeInTheDocument();
    // build failures are labelled as such; long durations in minutes; missing coverage as a dash
    expect(screen.getByText('Development build')).toBeInTheDocument();
    expect(screen.getByText(/2m 5s/)).toBeInTheDocument();
    const meters = screen.getAllByText('–', { selector: '.metrics-meters b' });
    expect(meters).toHaveLength(4);
    // the device table marks a suite that didn't run, and the grid has nothing to select
    const regions = screen.getAllByRole('region', { name: 'Coverage by device' });
    const devices = regions[regions.length - 1]!;
    expect(within(devices).getByRole('img', { name: 'all passed' })).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Test results by area and device' })).queryAllByRole('button')).toHaveLength(0);
  });

  it('shows when the latest test run happened', async () => {
    serve(sample);
    renderMetrics();
    const time = await screen.findByText((_, el) => el?.tagName === 'TIME');
    expect(time).toHaveAttribute('dateTime', sample.generatedAt);
  });
});
