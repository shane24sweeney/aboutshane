import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { METRICS_URL } from '../../frontend/src/api/metrics';
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
});
