import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { analyticsAllowed, isEuropeanTimeZone, setConsent, storedConsent } from '../../frontend/src/analytics/analytics';
import { vitalRating } from '../../frontend/src/api/visitors';
import ConsentBanner, { OPEN_COOKIE_SETTINGS } from '../../frontend/src/components/ConsentBanner';
import Visitors from '../../frontend/src/pages/Visitors';
import sample from '../e2e/support/visitors.sample.json';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const renderVisitors = () =>
  render(
    <MemoryRouter>
      <Visitors />
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

  it('lists the top countries, and selecting one marks it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(sample)));
    renderVisitors();
    const list = await screen.findByRole('list', { name: 'Top countries' });
    const us = within(list).getByRole('button', { name: /United States/ });
    fireEvent.click(us);
    expect(us).toHaveAttribute('aria-pressed', 'true');
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
