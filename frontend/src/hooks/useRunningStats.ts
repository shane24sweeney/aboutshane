import { useEffect, useState } from 'react';
import { CONTENT_TIMEOUT_MS, fetchRunningStats } from '../api/content';
import type { RunningStats } from '../content/types';

/**
 * Loads the running stats from the API. Unlike page content there is no bundled copy: the stats are
 * extra, so on an error or timeout this stays null and the page simply leaves them out.
 */
export function useRunningStats(): RunningStats | null {
  const [stats, setStats] = useState<RunningStats | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONTENT_TIMEOUT_MS);
    let active = true;

    fetchRunningStats(controller.signal)
      .then((data) => active && setStats(data))
      .catch(() => {})
      .finally(() => clearTimeout(timeout));

    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return stats;
}
