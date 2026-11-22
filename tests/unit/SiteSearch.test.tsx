import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SiteSearch from '../../frontend/src/components/SiteSearch';
import StatusBadge from '../../frontend/src/components/StatusBadge';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const RESULTS = {
  query: 'appium',
  count: 2,
  results: [
    { page: 'Resume', path: '/resume', title: 'Senior QE Consultant - Fifth Third Bank', snippet: 'Built a framework with Appium and WebdriverIO', highlights: [{ start: 23, length: 6 }] },
    { page: 'Home', path: '/home', title: 'Core Strengths', snippet: '<img src=x onerror=alert(1)> Appium', highlights: [{ start: 29, length: 6 }] },
  ],
};

function renderSearch() {
  return render(
    <MemoryRouter initialEntries={['/contact']}>
      <SiteSearch />
      <Routes>
        <Route path="/resume" element={<h1>Resume page</h1>} />
        <Route path="*" element={<h1>Other page</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function type(text: string) {
  fireEvent.change(screen.getByRole('combobox', { name: 'Search the site' }), { target: { value: text } });
  await act(() => vi.advanceTimersByTimeAsync(300));
}

describe('site search', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('searches after a short pause and lists the matches with the words marked', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(RESULTS));
    vi.stubGlobal('fetch', fetchMock);
    renderSearch();

    await type('appium');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/search?q=appium');
    const list = screen.getByRole('listbox', { name: 'Search results' });
    expect(within(list).getAllByRole('option')).toHaveLength(2);
    expect(within(list).getAllByText('Appium', { selector: 'mark' })).toHaveLength(2);
    expect(screen.getByText('2 matches')).toBeInTheDocument();
  });

  it('waits until the visitor stops typing, and ignores one-letter searches', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(RESULTS));
    vi.stubGlobal('fetch', fetchMock);
    renderSearch();

    await type('a');
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ap' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'app' } });
    await act(() => vi.advanceTimersByTimeAsync(300));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/search?q=app');
  });

  it('opens a result with the keyboard', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(RESULTS)));
    renderSearch();
    await type('appium');

    const box = screen.getByRole('combobox');
    fireEvent.keyDown(box, { key: 'ArrowDown' });
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(box, { key: 'Enter' });

    expect(screen.getByRole('heading', { name: 'Resume page' })).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows result text as text, never as HTML', { tags: ['negative'] }, async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(RESULTS)));
    const { container } = renderSearch();
    await type('appium');

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText(/<img src=x onerror=alert\(1\)>/)).toBeInTheDocument();
  });

  it('says when nothing matches', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ query: 'zzqx', count: 0, results: [] })));
    renderSearch();
    await type('zzqx');
    expect(screen.getByText('No matches for “zzqx”')).toBeInTheDocument();
  });

  it('says so when search is unavailable', { tags: ['negative'] }, async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ error: 'internal_error' }, 500)));
    renderSearch();
    await type('appium');
    expect(screen.getByText('Search is unavailable right now. Please try again.')).toBeInTheDocument();
  });

  it('closes on Escape, and "/" jumps back to the box', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(RESULTS)));
    renderSearch();
    await type('appium');

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    (document.activeElement as HTMLElement).blur();
    fireEvent.keyDown(document.body, { key: '/' });
    expect(screen.getByRole('combobox')).toHaveFocus();
  });
});

describe('status badge', () => {
  it('shows the API is up and how the daily tests went, linking to Metrics', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        json({ status: 'ok', version: '1.0.0', runtime: 'Java 25', startedAt: '', uptimeSeconds: 5, quality: { status: 'healthy', statusText: 'Healthy', headline: 'All passed', day: 'Today' } }),
      ),
    );
    render(
      <MemoryRouter>
        <StatusBadge />
      </MemoryRouter>,
    );
    await act(() => vi.advanceTimersByTimeAsync(1500));
    const badge = screen.getByRole('link', { name: 'All systems normal · Daily tests: Healthy' });
    expect(badge).toHaveAttribute('href', '/metrics');
    vi.useRealTimers();
  });

  it('stays hidden when the API cannot be reached', { tags: ['negative'] }, async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const { container } = render(
      <MemoryRouter>
        <StatusBadge />
      </MemoryRouter>,
    );
    await act(() => vi.advanceTimersByTimeAsync(1500));
    expect(container).toBeEmptyDOMElement();
    vi.useRealTimers();
  });
});
