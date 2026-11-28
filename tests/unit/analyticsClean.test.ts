import { describe, expect, it } from 'vitest';
import { amount, count, countryCode, onSiteOnly, pagePath, text, withSiteFilter } from '../../scripts/analytics/clean.mjs';

describe('Google Analytics export guards', () => {
  it('asks GA only for visits recorded on the site itself', () => {
    expect(withSiteFilter(undefined)).toEqual(onSiteOnly);
    const vitals = { filter: { fieldName: 'eventName', inListFilter: { values: ['LCP'] } } };
    expect(withSiteFilter(vitals)).toEqual({ andGroup: { expressions: [onSiteOnly, vitals] } });
    expect(onSiteOnly.filter.inListFilter.values).toEqual(['selenium-automation.com', 'www.selenium-automation.com']);
  });

  it('keeps real country codes and site paths', () => {
    expect(countryCode('US')).toBe('US');
    expect(pagePath('/analytics')).toBe('/analytics');
    expect(pagePath('/')).toBe('/');
    expect(text('Côte d’Ivoire')).toBe('Côte d’Ivoire');
  });

  it('drops values a made-up hit could carry', { tags: ['security', 'negative'] }, () => {
    for (const code of ['(not set)', 'usa', 'U', '<b>', '', undefined]) expect(countryCode(code as string)).toBeNull();
    for (const path of ['https://evil.example/', '/<script>alert(1)</script>', 'javascript:alert(1)', '/a b', `/${'x'.repeat(120)}`, 42]) {
      expect(pagePath(path as string)).toBeNull();
    }
    expect(text('<img src=x onerror=alert(1)>\u0007Spain')).toBe('img src=x onerror=alert(1)Spain');
    expect(text('x'.repeat(100))).toHaveLength(60);
  });

  it('turns odd numbers into safe ones', { tags: ['negative'] }, () => {
    expect(count(12.6)).toBe(13);
    expect(count(-3)).toBe(0);
    expect(count(Number.NaN)).toBe(0);
    expect(count(Infinity)).toBe(0);
    expect(amount(41.567, 1)).toBe(41.6);
    expect(amount(-1)).toBe(0);
  });
});
