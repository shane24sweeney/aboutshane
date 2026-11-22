import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { fetchStatus } from '../api/site';
import type { SiteStatus } from '../api/site';

const TONE = { healthy: 'ok', attention: 'warn', incomplete: 'warn' } as const;

/**
 * A small badge in the footer: whether the API is up, and how the latest daily tests went, linking
 * to Metrics. It loads after the page (it's not urgent) and stays hidden if the API is down.
 */
function StatusBadge() {
  const [status, setStatus] = useState<SiteStatus | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetchStatus(controller.signal).then(setStatus).catch(() => {});
    }, 1200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  if (!status) return null;
  const quality = status.quality;
  const tone = quality ? TONE[quality.status] : 'ok';
  const label = quality ? `All systems normal · Daily tests: ${quality.statusText}` : 'All systems normal';
  return (
    <Link to="/metrics" className={`status-badge status-${tone}`} title={quality?.headline ?? `API ${status.version} on ${status.runtime}`}>
      <span className="status-dot" aria-hidden="true" />
      {label}
    </Link>
  );
}

export default StatusBadge;
