import { useEffect, useState } from 'react';
import Spinner from 'react-bootstrap/Spinner';

/** Shown while page content loads; waits briefly so cached responses don't flash a spinner. */
function PageLoading({ delayMs = 300 }: { delayMs?: number }) {
  const [visible, setVisible] = useState(delayMs === 0);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  return (
    <div className="page-loading" role="status" aria-live="polite">
      {visible && <Spinner animation="border" className="page-loading-spinner" />}
      <span className="visually-hidden">Loading…</span>
    </div>
  );
}

export default PageLoading;
