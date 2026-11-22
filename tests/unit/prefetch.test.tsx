import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import Navigation from '../../frontend/src/components/Navigation';
import { cachedContent, cachedRunningStats, loadContent, loadRunningStats } from '../../frontend/src/content/cache';
import { fallbackContent } from '../../frontend/src/content/fallback';
import Education from '../../frontend/src/pages/Education';
import { prefetchAllWhenIdle, prefetchPage } from '../../frontend/src/prefetch';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const contentRequests = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls.map(([url]) => String(url)).filter((url) => url.startsWith('/api/content/'));

describe('content cache', () => {
  it('asks the API once when a prefetch and the page want the same content together', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(json(fallbackContent.education)));
    vi.stubGlobal('fetch', fetchMock);

    const [a, b] = await Promise.all([loadContent('education'), loadContent('education')]);

    expect(a).toBe(b);
    expect(contentRequests(fetchMock)).toEqual(['/api/content/education']);
  });

  it('shows content already loaded this visit at once, with no loading state and no request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(fallbackContent.education));
    vi.stubGlobal('fetch', fetchMock);
    await loadContent('education');
    fetchMock.mockClear();

    render(<Education />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(fallbackContent.education.length);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps nothing after a failed request, so the next visit tries the API again', { tags: ['negative'] }, async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json({ error: 'down' }, 503)).mockResolvedValue(json(fallbackContent.education));
    vi.stubGlobal('fetch', fetchMock);

    await expect(loadContent('education')).rejects.toThrow();
    expect(cachedContent('education')).toBeUndefined();
    await expect(loadContent('education')).resolves.toEqual(fallbackContent.education);
    expect(contentRequests(fetchMock)).toHaveLength(2);
  });

  it('settles the optional running stats to null when the API fails', { tags: ['negative'] }, async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(loadRunningStats()).resolves.toBeNull();
    expect(cachedRunningStats()).toBeNull();
  });
});

describe('prefetching', () => {
  it('starts loading a group’s first page the moment a pointer reaches its tile', () => {
    const fetchMock = vi.fn().mockReturnValue(new Promise(() => {}));
    vi.stubGlobal('fetch', fetchMock);
    render(
      <MemoryRouter initialEntries={['/home']}>
        <Navigation />
      </MemoryRouter>,
    );

    fireEvent.pointerEnter(screen.getByRole('link', { name: 'Experience' }));
    fireEvent.pointerDown(screen.getByRole('link', { name: 'Experience' }));
    fireEvent.focus(screen.getByRole('link', { name: 'Experience' }));

    expect(contentRequests(fetchMock)).toEqual(['/api/content/resume']);
  });

  it('loads the running page’s stats along with its content', () => {
    const fetchMock = vi.fn().mockReturnValue(new Promise(() => {}));
    vi.stubGlobal('fetch', fetchMock);

    prefetchPage('/running');

    expect(contentRequests(fetchMock).sort()).toEqual(['/api/content/running', '/api/content/running/stats']);
  });

  it('prefetches every page once the browser is idle', () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockReturnValue(new Promise(() => {}));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('requestIdleCallback', undefined);

    const stop = prefetchAllWhenIdle(['/resume', '/education']);
    expect(contentRequests(fetchMock)).toEqual([]);
    vi.advanceTimersByTime(1500);

    expect(contentRequests(fetchMock)).toEqual(['/api/content/resume', '/api/content/education']);
    stop();
  });

  it('prefetches nothing for a visitor saving data', { tags: ['negative'] }, () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockReturnValue(new Promise(() => {}));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('navigator', { ...navigator, connection: { saveData: true } });

    prefetchAllWhenIdle(['/resume', '/education']);
    vi.advanceTimersByTime(10_000);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
