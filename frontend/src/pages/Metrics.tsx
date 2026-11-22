import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { fetchMetrics, METRICS_TIMEOUT_MS, REPORT_URL, updatedAt } from '../api/metrics';
import type { Metrics as MetricsData, Status } from '../api/metrics';
import Donut from '../components/Donut';
import PageLoading from '../components/PageLoading';
// The 3D grid's stylesheet ships with the page (only the three.js code is lazy), so the Suspense
// placeholder below already has the stage's size and nothing shifts when the 3D view arrives.
import '../components/TestGrid3D.css';
import './Metrics.css';

// three.js is large, so the 3D chart loads only when this page does.
const TestGrid3D = lazy(() => import('../components/TestGrid3D'));

type State = { status: 'loading' } | { status: 'ready'; data: MetricsData } | { status: 'error' };

const ICONS: Record<Status, string> = { passed: '✓', failed: '✕', flaky: '!', skipped: '–' };
const ORDER: Status[] = ['failed', 'flaky', 'skipped', 'passed'];

const duration = (ms: number) =>
  ms >= 60_000 ? `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s` : `${Math.round(ms / 1000)}s`;
const percent = (part: number, whole: number) => (whole ? `${((part / whole) * 100).toFixed(part === whole ? 0 : 1)}%` : '–');
const shortDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function useMetrics(): State {
  const [state, setState] = useState<State>({ status: 'loading' });
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), METRICS_TIMEOUT_MS);
    let active = true;
    fetchMetrics(controller.signal)
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

/** The tests behind one bar of the 3D chart (or one cell of its table). */
function SelectedBar({ data, cellKey }: { data: MetricsData; cellKey: string | null }) {
  if (!cellKey) {
    return (
      <>
        <h3>Select a bar</h3>
        <p className="metrics-muted">Select a bar in the chart, or a cell in the table below, to list its individual tests.</p>
      </>
    );
  }
  const [r = 0, c = 0] = cellKey.split('|').map(Number);
  const cell = data.grid.cells[cellKey];
  if (!cell) return null;
  const counts = (['passed', 'failed', 'flaky', 'skipped'] as Status[]).filter((s) => cell[s]).map((s) => `${cell[s]} ${s}`);
  const tests = [...cell.tests].sort((a, b) => ORDER.indexOf(a.s) - ORDER.indexOf(b.s));
  return (
    <>
      <h3>
        {data.grid.rows[r]?.name} · {data.grid.columns[c]?.name}
      </h3>
      <p className="metrics-muted">
        {counts.join(', ')} ·{' '}
        <a href={new URL(cell.link, data.reportUrl || REPORT_URL).href} target="_blank" rel="noreferrer">
          Open in the full report
        </a>
      </p>
      <ul className="metrics-tests" aria-label="Tests" tabIndex={0}>
        {tests.map(({ t, s }, i) => (
          <li key={`${t}-${i}`}>
            <span className={`metrics-test-icon status-${s}`} role="img" aria-label={s}>
              {ICONS[s]}
            </span>
            {t}
          </li>
        ))}
      </ul>
    </>
  );
}

function Dashboard({ data }: { data: MetricsData }) {
  const [selected, setSelected] = useState<string | null>(null);
  const panel = useRef<HTMLElement>(null);
  const select = (key: string) => {
    setSelected(key);
    panel.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
  };
  const { ui, api } = data.development;
  const { regression, smoke, load } = data.qa;
  const slowest = Math.max(1, ...(load?.actions.map((a) => a.p95) ?? []));
  const mostMerged = Math.max(1, ...(data.delivery?.weeks.map((w) => w.merged) ?? []));

  return (
    <>
      <section className={`metrics-verdict tone-${data.status}`} aria-labelledby="metrics-headline">
        <span className="metrics-pill">
          {{ healthy: '✓', attention: '✕', incomplete: '!' }[data.status]} {data.statusText}
        </span>
        <h2 id="metrics-headline">{data.headline}</h2>
        <p>{data.summary}</p>
        <p className="metrics-muted">
          Latest test run: <time dateTime={data.generatedAt}>{updatedAt(data.generatedAt) || data.day}</time>
          {data.runUrl && (
            <>
              {' · '}
              <a href={data.runUrl} target="_blank" rel="noreferrer">
                see the run
              </a>
            </>
          )}
        </p>
      </section>

      <ul className="metrics-kpis" aria-label="Headline numbers">
        {data.kpis.map((k) => (
          <li key={k.label}>
            <span className="metrics-kpi-label">{k.label}</span>
            <span className={`metrics-kpi-value${k.tone ? ` tone-${k.tone}` : ''}`}>{k.value}</span>
            <span className="metrics-kpi-sub">{k.sub}</span>
          </li>
        ))}
      </ul>

      {data.failures.length > 0 && (
        <section className="metrics-card metrics-attention" aria-labelledby="metrics-attention">
          <h2 id="metrics-attention">Needs attention</h2>
          <ul>
            {data.failures.map((f, i) => (
              <li key={i}>
                <strong>
                  {f.area}: {f.title}
                </strong>
                <span className="metrics-muted">{f.device === 'Build' ? 'Development build' : f.device}</span>
                <code>{f.error}</code>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="metrics-card" aria-labelledby="metrics-dev">
        <h2 id="metrics-dev">Development</h2>
        <p className="metrics-muted">UI (React) and API (Spring Boot) tests, and how much of the code they cover.</p>
        <div className="metrics-split">
          <div className="metrics-donuts">
            <Donut title="UI unit tests" caption={ui ? `${ui.files} test files · ${duration(ui.duration)}` : undefined} counts={ui?.totals ?? null} />
            <Donut title="API tests" caption={api ? `${api.files} test classes · ${duration(api.duration)}` : undefined} counts={api?.totals ?? null} />
          </div>
          <div>
            <h3>Code coverage</h3>
            <ul className="metrics-meters">
              {[
                ['UI · lines', ui?.coverage?.lines],
                ['UI · branches', ui?.coverage?.branches],
                ['API · lines', api?.coverage?.lines],
                ['API · branches', api?.coverage?.branches],
              ].map(([label, value]) => (
                <li key={label as string}>
                  <span>{label}</span>
                  <b>{value != null ? `${Math.round(value as number)}%` : '–'}</b>
                  <span className="metrics-meter" aria-hidden="true">
                    <i style={{ width: `${(value as number) ?? 0}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="metrics-card" aria-labelledby="metrics-qa">
        <h2 id="metrics-qa">Quality assurance</h2>
        <p className="metrics-muted">End-to-end tests on desktop and phones, the live site, and the load test.</p>
        <div className="metrics-donuts">
          <Donut title="Regression" caption={regression ? `${regression.total} tests · ${regression.devices} devices` : undefined} counts={regression?.totals ?? null} />
          <Donut title="Live site" caption={smoke ? `${smoke.total} tests · ${smoke.devices} devices` : undefined} counts={smoke?.totals ?? null} />
          <Donut
            title="Load (JMeter)"
            caption={load ? `${load.samples} requests · typical ${load.median} ms` : undefined}
            counts={load ? { passed: load.samples - load.failed, failed: load.failed } : null}
          />
        </div>
      </section>

      <section className="metrics-card" aria-labelledby="metrics-3d">
        <h2 id="metrics-3d">Every test, every device</h2>
        <p className="metrics-muted">
          Each bar is one test area on one device: its height is the number of tests, its colours their results.
        </p>
        <Suspense fallback={<div className="grid3d" />}>
          <TestGrid3D grid={data.grid} onSelect={select} />
        </Suspense>
        <section className="metrics-selected" ref={panel} aria-live="polite" aria-label="Selected tests">
          <SelectedBar data={data} cellKey={selected} />
        </section>
        <details className="metrics-table">
          <summary>Table view</summary>
          {/* Focusable, so keyboard users can scroll it sideways on narrow screens. */}
          <div className="metrics-scroll" role="region" aria-label="Test results by area and device" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Test area</th>
                  {data.grid.columns.map((c) => (
                    <th key={c.name} scope="col">
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.grid.rows.map((row, r) => (
                  <tr key={row.name}>
                    <th scope="row">{row.name}</th>
                    {data.grid.columns.map((col, c) => {
                      const cell = data.grid.cells[`${r}|${c}`];
                      if (!cell) return <td key={col.name}>–</td>;
                      const ran = cell.passed + cell.failed + cell.flaky;
                      return (
                        <td key={col.name}>
                          <button type="button" className={cell.failed ? 'has-failures' : ''} onClick={() => select(`${r}|${c}`)}>
                            {cell.passed + cell.flaky}/{ran}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <div className="metrics-pair">
        <section className="metrics-card" aria-labelledby="metrics-devices">
          <h2 id="metrics-devices">Coverage by device</h2>
          <div className="metrics-scroll" role="region" aria-label="Coverage by device" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Device</th>
                  <th scope="col">Regression</th>
                  <th scope="col">Live site</th>
                </tr>
              </thead>
              <tbody>
                {data.devices.map(({ device, regression: reg, smoke: live }) => (
                  <tr key={device}>
                    <th scope="row">{device}</th>
                    {[reg, live].map((d, i) => (
                      <td key={i}>
                        {d ? (
                          <>
                            <span className={d.failed ? 'status-failed' : 'status-passed'} aria-label={d.failed ? 'failures' : 'all passed'} role="img">
                              {d.failed ? '✕' : '✓'}
                            </span>{' '}
                            {d.passed}/{d.passed + d.failed}
                          </>
                        ) : (
                          '–'
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="metrics-card" aria-labelledby="metrics-speed">
          <h2 id="metrics-speed">Speed under load</h2>
          <p className="metrics-muted">Typical time per action on the live site, and the time 95% of requests beat.</p>
          {load ? (
            <ul className="metrics-speed">
              {load.actions.map((a) => (
                <li key={a.action}>
                  <span>
                    {a.action}
                    {a.failed > 0 && <b className="status-failed"> {a.failed} failed</b>}
                  </span>
                  <span className="metrics-speed-num">
                    {a.median} ms <span className="metrics-muted">· {a.p95}</span>
                  </span>
                  <span className="metrics-meter" aria-hidden="true">
                    <i style={{ width: `${Math.max((a.median / slowest) * 100, 2)}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="metrics-muted">The load test didn't finish today.</p>
          )}
        </section>
      </div>

      <div className="metrics-pair">
        {data.delivery && (
          <section className="metrics-card" aria-labelledby="metrics-delivery">
            <h2 id="metrics-delivery">Delivery</h2>
            <p className="metrics-muted">The last {data.delivery.days} days on GitHub.</p>
            <ul className="metrics-mini">
              <li>
                <b>{data.delivery.mergedPullRequests}</b> pull requests merged
              </li>
              <li>
                <b>{data.delivery.commits}</b> commits
              </li>
              <li>
                <b>{percent(data.delivery.ciPassed, data.delivery.ciRuns)}</b> of {data.delivery.ciRuns} CI runs passed
              </li>
            </ul>
            <h3>Pull requests merged per week</h3>
            <ol className="metrics-columns" aria-label="Pull requests merged per week">
              {data.delivery.weeks.map((w) => (
                <li key={w.end} aria-label={`Week to ${shortDate(w.end)}: ${w.merged}`}>
                  <b>{w.merged}</b>
                  <span className="metrics-column" style={{ height: `${(w.merged / mostMerged) * 100}%` }} aria-hidden="true" />
                  <span className="metrics-muted">{shortDate(w.end)}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="metrics-card" aria-labelledby="metrics-trend">
          <h2 id="metrics-trend">{data.history.length === 1 ? 'Last day' : `Last ${data.history.length} days`}</h2>
          <p className="metrics-muted">
            {data.history.filter((h) => h.status === 'healthy').length} of {data.history.length}{' '}
            {data.history.length === 1 ? 'day' : 'days'} fully green.
          </p>
          <ol className="metrics-trend">
            {data.history.map((h) => (
              <li key={h.date} className={`trend-${h.status}`} title={`${shortDate(h.date)}: ${h.status}`}>
                <span className="visually-hidden">
                  {shortDate(h.date)}: {{ healthy: 'all passed', attention: 'failures', incomplete: 'incomplete' }[h.status]}
                </span>
              </li>
            ))}
          </ol>
          <p className="metrics-key">
            <span><i className="trend-healthy" />All passed</span>
            <span><i className="trend-attention" />Failures</span>
            <span><i className="trend-incomplete" />Incomplete</span>
          </p>
        </section>
      </div>

      <p className="metrics-links">
        <a className="metrics-button" href={data.reportUrl || REPORT_URL} target="_blank" rel="noreferrer">
          Open the full quality report
        </a>
        {data.runUrl && (
          <a href={data.runUrl} target="_blank" rel="noreferrer">
            Today's GitHub Actions run
          </a>
        )}
      </p>
    </>
  );
}

function Metrics() {
  const state = useMetrics();
  return (
    <section id="metrics" className="metrics-page">
      <h1>Quality dashboard</h1>
      <p className="metrics-lede">
        How this site is built and tested, updated every morning: unit and API tests with code coverage, end-to-end tests on
        desktop and phones, the live site, and a load test.
      </p>
      {state.status === 'loading' && <PageLoading />}
      {state.status === 'error' && (
        <p className="metrics-card metrics-error" role="alert">
          Today's metrics couldn't be loaded. The full report is at{' '}
          <a href={REPORT_URL} target="_blank" rel="noreferrer">
            {REPORT_URL.replace('https://', '')}
          </a>
          .
        </p>
      )}
      {state.status === 'ready' && <Dashboard data={state.data} />}
    </section>
  );
}

export default Metrics;
