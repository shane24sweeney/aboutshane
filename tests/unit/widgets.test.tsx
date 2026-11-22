import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import Donut from '../../frontend/src/components/Donut';
import StatusBadge from '../../frontend/src/components/StatusBadge';

describe('Donut', () => {
  const rate = (counts: Parameters<typeof Donut>[0]['counts']) => {
    const { container, unmount } = render(<Donut title="Suite" counts={counts} />);
    const middle = container.querySelector('text')?.textContent;
    unmount();
    return middle;
  };

  it('shows the pass rate of what ran, ignoring skipped tests', () => {
    expect(rate({ passed: 3, failed: 1, skipped: 10 })).toBe('75.0%');
    expect(rate({ passed: 5 })).toBe('100%');
    // flaky tests passed on a retry, so they count as passed
    expect(rate({ passed: 1, flaky: 1 })).toBe('100%');
  });

  it('never rounds one failure among thousands up to 100%', () => {
    expect(rate({ passed: 9999, failed: 1 })).toBe('99.9%');
  });

  it('shows a dash when nothing ran, and "no results" when the suite has none', { tags: ['negative'] }, () => {
    expect(rate({ skipped: 4 })).toBe('–');
    render(<Donut title="Load" counts={null} />);
    expect(screen.getByRole('img', { name: 'Load: no results today' })).toBeInTheDocument();
  });
});

describe('StatusBadge', () => {
  const status = { status: 'ok', version: '1.2', runtime: 'Java 25', startedAt: '', uptimeSeconds: 1 };
  const badge = async (body: unknown) => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })));
    render(
      <MemoryRouter>
        <StatusBadge />
      </MemoryRouter>,
    );
    // It waits 1.2 s so it never competes with the page itself.
    await act(() => vi.advanceTimersByTimeAsync(1300));
    return screen.queryByRole('link');
  };

  it('shows the API is up, with its version, before the first daily report', async () => {
    const link = await badge({ ...status, quality: null });
    expect(link).toHaveTextContent('All systems normal');
    expect(link).toHaveAttribute('title', 'API 1.2 on Java 25');
    expect(link).toHaveClass('status-ok');
  });

  it('warns when the latest daily tests need attention', async () => {
    const link = await badge({ ...status, quality: { status: 'attention', statusText: '2 failed', headline: 'Two tests failed', day: '2026-11-22' } });
    expect(link).toHaveTextContent('All systems normal · Daily tests: 2 failed');
    expect(link).toHaveAttribute('title', 'Two tests failed');
    expect(link).toHaveClass('status-warn');
  });

  it('stays hidden when the API is down', { tags: ['negative'] }, async () => {
    expect(await badge({ error: 'internal_error' })).toBeNull();
  });
});
