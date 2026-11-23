import { lazy, Suspense, useEffect, useState } from 'react';
import { fetchVisitors, isAvailable, vitalRating } from '../api/visitors';
import type { VisitorStats, VisitorsResponse } from '../api/visitors';
import PageLoading from '../components/PageLoading';
// The globe's stylesheet ships with the page (only the three.js code is lazy), so the Suspense
// placeholder below already has the stage's size and nothing shifts when the 3D view arrives.
import '../components/VisitorGlobe3D.css';
import '../components/VisitorMolecule3D.css';
import './Analytics.css';

// three.js and the detailed Earth load only with this page.
const VisitorGlobe3D = lazy(() => import('../components/VisitorGlobe3D'));
const VisitorMolecule3D = lazy(() => import('../components/VisitorMolecule3D'));

type State = { status: 'loading' } | { status: 'ready'; data: VisitorsResponse } | { status: 'error' };

const number = (n: number) => n.toLocaleString('en-US');
const percent = (share: number | null) => (share == null ? '–' : `${Math.round(share * 100)}%`);
const minutes = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
const VITALS = [
  { key: 'LCP', name: 'Largest content shown', unit: 'ms' },
  { key: 'INP', name: 'Response to a tap or click', unit: 'ms' },
  { key: 'CLS', name: 'Layout shift', unit: '' },
  { key: 'FCP', name: 'First content shown', unit: 'ms' },
  { key: 'TTFB', name: 'First byte from the server', unit: 'ms' },
] as const;
const RATING = { good: 'Good', 'needs-improvement': 'Needs improvement', poor: 'Poor' } as const;

function useVisitors(): State {
  const [state, setState] = useState<State>({ status: 'loading' });
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let active = true;
    fetchVisitors(controller.signal)
      .then((data) => active && setState({ status: 'ready', data }))
      .catch(() => active && setState({ status: 'error' }))
      .finally(() => clearTimeout(timeout));
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);
  return state;
}

/** How fast the site is: real visitors (from GA), the API (CloudWatch) and the load test. */
function Speed({ speed, days }: { speed: VisitorStats['speed']; days: number }) {
  return (
    <section className="visitors-card" aria-labelledby="visitors-speed">
      <h2 id="visitors-speed">How fast it is</h2>
      <p className="visitors-muted">Measured three ways over the last {days} days, next to who visited.</p>
      <div className="visitors-speed">
        <div>
          <h3>For real visitors</h3>
          {speed.realUsers ? (
            <ul className="visitors-vitals">
              {VITALS.filter(({ key }) => speed.realUsers?.[key]).map(({ key, name, unit }) => {
                const vital = speed.realUsers![key]!;
                const rating = vitalRating(key, vital.average);
                return (
                  <li key={key}>
                    <span className="visitors-vital-name">
                      {name} <abbr title={key}>({key})</abbr>
                    </span>
                    <b>
                      {key === 'CLS' ? vital.average.toFixed(2) : number(vital.average)}
                      {unit && ` ${unit}`}
                    </b>
                    <span className={`visitors-rating rating-${rating}`}>{RATING[rating]}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="visitors-muted">Collecting: real visitors' timings appear once enough visits are recorded.</p>
          )}
        </div>
        <div>
          <h3>The API</h3>
          {speed.api && speed.api.p50 != null ? (
            <ul className="visitors-stats">
              <li><span>Typical response</span><b>{number(speed.api.p50)} ms</b></li>
              <li><span>9 in 10 within</span><b>{number(speed.api.p90 ?? 0)} ms</b></li>
              <li><span>99 in 100 within</span><b>{number(speed.api.p99 ?? 0)} ms</b></li>
              <li><span>Requests</span><b>{number(speed.api.requests)}</b></li>
            </ul>
          ) : (
            <p className="visitors-muted">No API timings yet.</p>
          )}
        </div>
        <div>
          <h3>Under load (JMeter)</h3>
          {speed.load && speed.load.median != null ? (
            <ul className="visitors-stats">
              <li><span>Typical response</span><b>{number(speed.load.median)} ms</b></li>
              <li><span>95 in 100 within</span><b>{number(speed.load.p95 ?? 0)} ms</b></li>
              <li><span>Requests in the latest run</span><b>{number(speed.load.requests)}</b></li>
            </ul>
          ) : (
            <p className="visitors-muted">No load-test results yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function Dashboard({ data }: { data: VisitorStats }) {
  const [selected, setSelected] = useState<string | null>(null);
  const countryTotal = data.countries.reduce((n, c) => n + c.users, 0);
  const abroad = data.usShare == null ? null : 1 - data.usShare;
  const top = data.countries.slice(0, 12);
  const most = Math.max(1, ...top.map((c) => c.users));
  const busiestDay = Math.max(1, ...data.daily.map((d) => d.users));
  const mostViews = Math.max(1, ...data.pages.map((p) => p.views));
  const kpis = [
    { label: 'Visitors', value: number(data.totals.users), sub: `${number(data.totals.newUsers)} new` },
    { label: 'Page views', value: number(data.totals.pageViews), sub: `${number(data.totals.sessions)} visits` },
    { label: 'Countries', value: number(data.countries.length), sub: 'where visitors came from' },
    { label: 'In the US', value: percent(data.usShare), sub: `${number(data.countries.find((c) => c.code === 'US')?.users ?? 0)} visitors` },
    { label: 'Abroad', value: percent(abroad), sub: `${number(countryTotal - (data.countries.find((c) => c.code === 'US')?.users ?? 0))} visitors` },
    { label: 'Average visit', value: minutes(data.totals.avgSessionSeconds), sub: 'minutes' },
  ];

  return (
    <>
      <ul className="visitors-kpis" aria-label="Visitor numbers">
        {kpis.map((k) => (
          <li key={k.label}>
            <span className="visitors-kpi-label">{k.label}</span>
            <span className="visitors-kpi-value">{k.value}</span>
            <span className="visitors-kpi-sub">{k.sub}</span>
          </li>
        ))}
      </ul>

      <section className="visitors-card" aria-labelledby="visitors-molecule">
        <h2 id="visitors-molecule">The site at a glance</h2>
        <p className="visitors-muted">
          The site at the centre, bonded to its most viewed pages, where visitors come from, and how fast it is. Bigger atoms mean
          more views or visitors.
        </p>
        <Suspense fallback={<div className="molecule3d" />}>
          <VisitorMolecule3D stats={data} />
        </Suspense>
      </section>

      <section className="visitors-card visitors-world" aria-labelledby="visitors-where">
        <h2 id="visitors-where">Where visitors come from</h2>
        <div className="visitors-world-grid">
          <Suspense fallback={<div className="visitor-globe" />}>
            <VisitorGlobe3D countries={data.countries} selected={selected} onSelect={setSelected} />
          </Suspense>
          <div>
            <div className="visitors-split" role="img" aria-label={`${percent(data.usShare)} in the US, ${percent(abroad)} abroad`}>
              <span className="visitors-split-us" style={{ width: `${(data.usShare ?? 0) * 100}%` }} />
              <span className="visitors-split-abroad" style={{ width: `${(abroad ?? 0) * 100}%` }} />
            </div>
            <p className="visitors-split-key">
              <span><i className="key-us" />US {percent(data.usShare)}</span>
              <span><i className="key-abroad" />Abroad {percent(abroad)}</span>
            </p>
            <h3>Top countries</h3>
            <ol className="visitors-countries" aria-label="Top countries">
              {top.map((c) => (
                <li key={c.code} className={c.code === selected ? 'selected' : ''}>
                  <button type="button" onClick={() => setSelected(c.code === selected ? null : c.code)} aria-pressed={c.code === selected}>
                    <span className="visitors-country-name">{c.name}</span>
                    <span className="visitors-country-users">{number(c.users)}</span>
                    <span className="visitors-bar" aria-hidden="true">
                      <i className={c.code === 'US' ? 'bar-us' : 'bar-abroad'} style={{ width: `${(c.users / most) * 100}%` }} />
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <Speed speed={data.speed} days={data.days} />

      <div className="visitors-pair">
        <section className="visitors-card" aria-labelledby="visitors-daily">
          <h2 id="visitors-daily">Visitors per day</h2>
          <ol className="visitors-days" aria-label="Visitors per day">
            {data.daily.map((d) => (
              <li key={d.date} title={`${d.date}: ${d.users}`} aria-label={`${d.date}: ${d.users} visitors`}>
                <span style={{ height: `${(d.users / busiestDay) * 100}%` }} />
              </li>
            ))}
          </ol>
          {data.daily.length > 0 && (
            <p className="visitors-axis">
              <span>{data.daily[0]!.date}</span>
              <span>{data.daily[data.daily.length - 1]!.date}</span>
            </p>
          )}
        </section>
        <section className="visitors-card" aria-labelledby="visitors-pages">
          <h2 id="visitors-pages">Most viewed pages</h2>
          <ol className="visitors-pages">
            {data.pages.map((p) => (
              <li key={p.path}>
                <span>{p.path}</span>
                <b>{number(p.views)}</b>
                <span className="visitors-bar" aria-hidden="true">
                  <i className="bar-abroad" style={{ width: `${(p.views / mostViews) * 100}%` }} />
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <p className="visitors-muted visitors-footnote">
        Last {data.days} days, updated <time dateTime={data.generatedAt}>{new Date(data.generatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</time>.
        Visitor numbers come from Google Analytics (only with consent where required), API timings from AWS CloudWatch, and
        load timings from the daily JMeter run.
      </p>
    </>
  );
}

function Analytics() {
  const state = useVisitors();
  return (
    <section id="visitors" className="visitors-page">
      <h1>Site analytics</h1>
      <p className="visitors-lede">
        From Google Analytics: who visits this site, from where (the US or abroad), and how fast it is for them.
      </p>
      {state.status === 'loading' && <PageLoading />}
      {state.status === 'error' && (
        <p className="visitors-card" role="alert">
          Visitor numbers couldn't be loaded right now. Please try again later.
        </p>
      )}
      {state.status === 'ready' && !isAvailable(state.data) && (
        <p className="visitors-card" role="status">
          {state.data.message}
        </p>
      )}
      {state.status === 'ready' && isAvailable(state.data) && <Dashboard data={state.data} />}
    </section>
  );
}

export default Analytics;
