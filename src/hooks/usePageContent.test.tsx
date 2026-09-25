import { act, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { CONTENT_TIMEOUT_MS } from '../api/content';
import { fallbackContent } from '../content/fallback';
import type { Degree } from '../content/types';
import Education from '../pages/Education';
import { usePageContent } from './usePageContent';

const apiDegrees: Degree[] = [{ degree: 'Degree served by the API', school: 'API University', logo: 'UCC' }];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function Probe() {
  const state = usePageContent('education');
  return <output>{state.status === 'ready' ? `${state.source}: ${state.data[0]?.degree}` : 'loading'}</output>;
}

describe('usePageContent', () => {
  it('requests the page from the content API and renders what it returns', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(apiDegrees));
    vi.stubGlobal('fetch', fetchMock);

    render(<Education />);

    expect(await screen.findByRole('heading', { name: 'Degree served by the API' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/content/education', expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it.each([
    ['the API returns an error status', () => Promise.resolve(jsonResponse({ error: 'internal_error' }, 500))],
    ['the API is unreachable', () => Promise.reject(new TypeError('Failed to fetch'))],
    ['the API returns the wrong shape', () => Promise.resolve(jsonResponse({ unexpected: true }))],
  ])('falls back to bundled content when %s', async (_case, respond) => {
    vi.stubGlobal('fetch', vi.fn(respond));
    render(<Probe />);
    expect(await screen.findByText(`fallback: ${fallbackContent.education[0]?.degree}`)).toBeInTheDocument();
  });

  it('falls back when the API is too slow, and aborts the request', async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init: RequestInit) => {
        signal = init.signal ?? undefined;
        return new Promise<Response>((_resolve, reject) =>
          signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))),
        );
      }),
    );

    render(<Probe />);
    expect(screen.getByText('loading')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(CONTENT_TIMEOUT_MS);
    });
    expect(signal?.aborted).toBe(true);
    expect(screen.getByText(`fallback: ${fallbackContent.education[0]?.degree}`)).toBeInTheDocument();
  });

  it('shows a loading indicator only when the API is slow to answer', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})));

    render(<Education />);
    const status = screen.getByRole('status');
    expect(status.querySelector('.spinner-border')).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(status.querySelector('.spinner-border')).not.toBeNull();
  });
});
