import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { analyticsAllowed, isEuropeanTimeZone, setConsent, storedConsent } from '../../frontend/src/analytics/analytics';
import { vitalRating } from '../../frontend/src/api/visitors';
import ConsentBanner, { OPEN_COOKIE_SETTINGS } from '../../frontend/src/components/ConsentBanner';
import Analytics from '../../frontend/src/pages/Analytics';
import sample from '../e2e/support/visitors.sample.json';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const renderVisitors = () =>
  render(
    <MemoryRouter>
      <Analytics />
    </MemoryRouter>,
  );

function inTimeZone(timeZone: string) {
  const resolved = Intl.DateTimeFormat().resolvedOptions();
  vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({ ...resolved, timeZone });
}

afterEach(() => localStorage.clear());

describe('analytics rules', () => {
  it('only runs on the real site, for real browsers that have not opted out', () => {
    const site = { hostname: 'selenium-automation.com' };
    expect(analyticsAllowed(site)).toBe(true);
    expect(analyticsAllowed({ hostname: 'www.selenium-automation.com' })).toBe(true);
    expect(analyticsAllowed({ ...site, webdriver: true })).toBe(false);
    expect(analyticsAllowed({ hostname: 'localhost' })).toBe(false);
    expect(analyticsAllowed({ ...site, globalPrivacyControl: true })).toBe(false);
    expect(analyticsAllowed({ ...site, doNotTrack: '1' })).toBe(false);
  });

  it('treats European time zones as needing consent first', () => {
    expect(isEuropeanTimeZone('Europe/Dublin')).toBe(true);
    expect(isEuropeanTimeZone('Atlantic/Reykjavik')).toBe(true);
    expect(isEuropeanTimeZone('America/New_York')).toBe(false);
    expect(isEuropeanTimeZone(undefined)).toBe(false);
  });

  it('rates web vitals with Google’s thresholds', () => {
    expect(vitalRating('LCP', 1800)).toBe('good');
    expect(vitalRating('LCP', 3000)).toBe('needs-improvement');
    expect(vitalRating('INP', 600)).toBe('poor');
    expect(vitalRating('CLS', 0.1)).toBe('good');
  });
});

describe('cookie consent banner', () => {
  it('asks visitors in Europe, and remembers their choice', () => {
    inTimeZone('Europe/Dublin');
    render(<ConsentBanner />);
    const banner = screen.getByRole('region', { name: 'Cookie consent' });
    fireEvent.click(within(banner).getByRole('button', { name: 'Accept analytics' }));
    expect(screen.queryByRole('region', { name: 'Cookie consent' })).not.toBeInTheDocument();
    expect(storedConsent()).toBe('granted');
  });

  it('does not ask visitors elsewhere, or anyone who has already chosen', () => {
    inTimeZone('America/New_York');
    const { unmount } = render(<ConsentBanner />);
    expect(screen.queryByRole('region', { name: 'Cookie consent' })).not.toBeInTheDocument();
    unmount();
    inTimeZone('Europe/Paris');
    setConsent('denied');
    render(<ConsentBanner />);
    expect(screen.queryByRole('region', { name: 'Cookie consent' })).not.toBeInTheDocument();
  });

  it('opens again from Cookie settings, showing the current choice', () => {
    inTimeZone('America/New_York');
    setConsent('granted');
    render(<ConsentBanner />);
    fireEvent(window, new Event(OPEN_COOKIE_SETTINGS));
    expect(screen.getByRole('region', { name: 'Cookie consent' })).toHaveTextContent('You currently allow them.');
    fireEvent.click(screen.getByRole('button', { name: 'Decline' }));
    expect(storedConsent()).toBe('denied');
  });
});

describe('Visitors page', () => {
  it('shows visitor numbers, US and abroad, the globe, and the site’s speed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(sample)));
    renderVisitors();
    const numbers = await screen.findByRole('list', { name: 'Visitor numbers' });
    expect(within(numbers).getByText(sample.totals.users.toLocaleString('en-US'))).toBeInTheDocument();
    expect(within(numbers).getByText('67%')).toBeInTheDocument();
    expect(within(numbers).getByText('33%')).toBeInTheDocument();
    expect(screen.getByTestId('visitor-globe')).toHaveTextContent(`${sample.countries.length} countries on the globe`);
    expect(screen.getByRole('heading', { name: 'How fast it is' })).toBeInTheDocument();
    expect(screen.getByText('1,840 ms')).toBeInTheDocument();
    expect(screen.getAllByText('Good').length).toBeGreaterThan(0);
  });

  it('shows how people arrive, their devices and browsers, and when they visit', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(sample)));
    renderVisitors();
    const sources = await screen.findByRole('list', { name: 'Visits by source' });
    expect(within(sources).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Direct41', 'Organic Search18', 'Organic Social9', 'Referral4']);
    expect(screen.getByText('Returning visitors').nextSibling).toHaveTextContent('6 (20%)');
    expect(screen.getByText('Visits with real engagement').nextSibling).toHaveTextContent('62%');
    expect(screen.getByText('Time engaged per visit').nextSibling).toHaveTextContent('1:35');
    // GA's device names read as people say them; one it doesn't know stays as it is.
    expect(within(screen.getByRole('list', { name: 'Visitors by device' })).getAllByRole('listitem').map((li) => li.firstChild?.textContent)).toEqual(['Desktop', 'Phone', 'smart tv']);
    expect(within(screen.getByRole('list', { name: 'Visitors by browser' })).getByText('Chrome')).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Visitors by operating system' })).getByText('iOS')).toBeInTheDocument();
    const days = screen.getByRole('list', { name: 'Visits by day of the week' });
    expect(within(days).getByLabelText('Mon: 14 visits')).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Visits by hour of the day' })).getByLabelText('6:00: 1 visit')).toBeInTheDocument();
  });

  it('leaves the audience out until the export has it, and says when a list is empty', { tags: ['negative'] }, async () => {
    const { audience, ...older } = sample;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(older)));
    const { unmount } = renderVisitors();
    await screen.findByRole('list', { name: 'Visitor numbers' });
    expect(screen.queryByRole('heading', { name: 'How people arrive' })).not.toBeInTheDocument();
    unmount();

    const quiet = { ...audience, browsers: [], engagement: { newUsers: 0, returningUsers: 0, engagementRate: 0, avgEngagedSeconds: 0 } };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ ...sample, audience: quiet })));
    renderVisitors();
    await screen.findByRole('heading', { name: 'Devices and browsers' });
    expect(screen.getByText('None recorded yet.')).toBeInTheDocument();
    expect(screen.getByText('Returning visitors').nextSibling).toHaveTextContent(/^0$/);
  });

  it('lists the top countries, and selecting one marks it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(sample)));
    renderVisitors();
    const list = await screen.findByRole('list', { name: 'Top countries' });
    const us = within(list).getByRole('button', { name: /United States/ });
    fireEvent.click(us);
    expect(us).toHaveAttribute('aria-pressed', 'true');
  });

  it('selecting the chosen country again clears it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(sample)));
    renderVisitors();
    const list = await screen.findByRole('list', { name: 'Top countries' });
    const us = within(list).getByRole('button', { name: /United States/ });
    fireEvent.click(us);
    fireEvent.click(us);
    expect(us).toHaveAttribute('aria-pressed', 'false');
  });

  it('rates slow and unsteady pages, and marks missing API percentiles', async () => {
    const slow = {
      ...sample,
      speed: {
        realUsers: { LCP: { average: 5200, samples: 10 }, CLS: { average: 0.15, samples: 10 } },
        api: { days: 30, p50: 30, p90: null, p99: null, requests: 12 },
        load: { median: 40, p95: null, requests: 9 },
      },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(slow)));
    renderVisitors();
    await screen.findByRole('heading', { name: 'How fast it is' });
    expect(screen.getByText('Poor')).toBeInTheDocument();
    expect(screen.getByText('Needs improvement')).toBeInTheDocument();
    expect(screen.getByText('0.15')).toBeInTheDocument();
    // only the vitals that were measured are listed
    expect(screen.queryByText(/Response to a tap or click/)).not.toBeInTheDocument();
    expect(screen.getAllByText('0 ms')).toHaveLength(3);
  });

  it('says which speed numbers are still being collected', { tags: ['negative'] }, async () => {
    const empty = { ...sample, usShare: null, countries: [], daily: [], pages: [], speed: { realUsers: null, api: null, load: null } };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(empty)));
    renderVisitors();
    await screen.findByRole('heading', { name: 'How fast it is' });
    expect(screen.getByText(/Collecting: real visitors' timings/)).toBeInTheDocument();
    expect(screen.getByText('No API timings yet.')).toBeInTheDocument();
    expect(screen.getByText('No load-test results yet.')).toBeInTheDocument();
    // with no country data, the US share and abroad are dashes rather than 0%
    expect(screen.getByRole('img', { name: '– in the US, – abroad' })).toBeInTheDocument();
  });

  it('says the numbers are coming before the first export', { tags: ['negative'] }, async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ available: false, message: 'Visitor numbers are collected daily.' })));
    renderVisitors();
    expect(await screen.findByText('Visitor numbers are collected daily.')).toBeInTheDocument();
  });

  it('says so when the numbers cannot be loaded', { tags: ['negative'] }, async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ error: 'internal_error' }, 500)));
    renderVisitors();
    expect(await screen.findByRole('alert')).toHaveTextContent("Visitor numbers couldn't be loaded");
  });
});
