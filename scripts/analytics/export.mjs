// Exports the last 30 days of Google Analytics to visitors.json for the site's Visitors tab
// (served by GET /api/visitors). Runs in the daily workflow after the quality report is built:
//
//   GA_SERVICE_ACCOUNT='<service account key JSON>' node scripts/analytics/export.mjs <site> [api-latency.json]
//
// - Visitors: by country (US and abroad), totals, most-viewed pages and visitors per day, from the
//   GA4 Data API as a read-only service account (free; no client library, just a signed token).
// - Speed: real visitors' Core Web Vitals (sent by the site as GA events), the API's own response
//   times from CloudWatch (api-latency.json, written by the workflow), and the load test's from
//   the quality report's metrics.json.
// Without GA_SERVICE_ACCOUNT it skips the export (and says so), so the workflow never fails on it.

import { createSign } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [site = 'site', latencyFile] = process.argv.slice(2);
const property = process.env.GA_PROPERTY_ID ?? '565419707';
const days = 30;

const key = process.env.GA_SERVICE_ACCOUNT;
if (!key) {
  console.log('GA_SERVICE_ACCOUNT is not set: skipping the visitor export.');
  process.exit(0);
}

const base64url = (value) => Buffer.from(value).toString('base64url');

/** A short-lived Google access token for the service account (OAuth 2.0 JWT bearer flow). */
async function accessToken({ client_email, private_key }) {
  const now = Math.floor(Date.now() / 1000);
  const claims = { iss: client_email, scope: 'https://www.googleapis.com/auth/analytics.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 600 };
  const unsigned = `${base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${base64url(JSON.stringify(claims))}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(private_key, 'base64url');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Google sign-in failed: ${response.status} ${await response.text()}`);
  return (await response.json()).access_token;
}

async function report(token, body) {
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${property}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'yesterday' }], ...body }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`GA report failed: ${response.status} ${await response.text()}`);
  const json = await response.json();
  return (json.rows ?? []).map((row) => ({
    dims: (row.dimensionValues ?? []).map((v) => v.value),
    mets: (row.metricValues ?? []).map((v) => Number(v.value)),
  }));
}

const readJson = (file) => (file && existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null);

try {
  const token = await accessToken(JSON.parse(key));
  const [totalsRows, countryRows, pageRows, dailyRows, vitalRows] = await Promise.all([
    report(token, { metrics: ['activeUsers', 'newUsers', 'sessions', 'screenPageViews', 'averageSessionDuration'].map((name) => ({ name })) }),
    report(token, {
      dimensions: [{ name: 'countryId' }, { name: 'country' }],
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 250,
    }),
    report(token, {
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 12,
    }),
    report(token, { dimensions: [{ name: 'date' }], metrics: [{ name: 'activeUsers' }], orderBys: [{ dimension: { dimensionName: 'date' } }] }),
    report(token, {
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }, { name: 'eventValue' }],
      dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'] } } },
    }),
  ]);

  const [users = 0, newUsers = 0, sessions = 0, pageViews = 0, avgSessionSeconds = 0] = totalsRows[0]?.mets ?? [];
  const countries = countryRows
    .filter(({ dims: [code] }) => code && code !== '(not set)')
    .map(({ dims: [code, name], mets: [countryUsers, countrySessions] }) => ({ code, name, users: countryUsers, sessions: countrySessions }));
  const countryUsers = countries.reduce((n, c) => n + c.users, 0);
  const us = countries.find((c) => c.code === 'US')?.users ?? 0;

  // Web vitals: GA sums each event's value (ms; CLS × 1000), so the average is sum ÷ count.
  const vitals = Object.fromEntries(
    vitalRows.map(({ dims: [name], mets: [count, sum] }) => {
      const average = count ? sum / count : 0;
      return [name, { average: name === 'CLS' ? Math.round(average) / 1000 : Math.round(average), samples: count }];
    }),
  );

  const metrics = readJson(join(site, 'metrics.json'));
  const visitors = {
    version: 1,
    generatedAt: new Date().toISOString(),
    days,
    totals: { users, newUsers, sessions, pageViews, avgSessionSeconds: Math.round(avgSessionSeconds) },
    usShare: countryUsers ? us / countryUsers : null,
    countries,
    pages: pageRows.map(({ dims: [path], mets: [views] }) => ({ path, views })),
    daily: dailyRows.map(({ dims: [date], mets: [dayUsers] }) => ({ date: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6)}`, users: dayUsers })),
    speed: {
      realUsers: Object.keys(vitals).length ? vitals : null,
      api: readJson(latencyFile),
      load: metrics?.qa?.load ? { median: metrics.qa.load.median, p95: metrics.qa.load.p95, requests: metrics.qa.load.samples } : null,
    },
  };
  writeFileSync(join(site, 'visitors.json'), JSON.stringify(visitors));
  console.log(`Visitors: ${users} in ${days} days from ${countries.length} countries (${Math.round((visitors.usShare ?? 0) * 100)}% US).`);
} catch (error) {
  // The report still publishes without visitor numbers; the page says they're unavailable.
  console.warn(`Visitor export skipped: ${error.message}`);
}
