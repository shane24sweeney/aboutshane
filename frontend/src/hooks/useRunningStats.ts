import { useEffect, useState } from 'react';
import { CONTENT_TIMEOUT_MS, fetchRunningStats } from '../api/content';
import type { RunningStats } from '../content/types';

/**
 * Loads the running stats from the API: undefined while loading, then the stats, or null on an error
 * or timeout. Unlike page content there is no bundled copy: the stats are extra, so on failure the
 * page simply leaves them out. The page waits for this as well as its content, so the stats don't
 * appear later and push the map and table down.
 */
export function useRunningStats(): RunningStats | null | undefined {
  const [stats, setStats] = useState<RunningStats | null | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONTENT_TIMEOUT_MS);
    let active = true;

    fetchRunningStats(controller.signal)
      .then((data) => active && setStats(data))
      .catch(() => active && setStats(null))
      .finally(() => clearTimeout(timeout));

    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return stats;
}
