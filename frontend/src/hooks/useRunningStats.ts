import { useEffect, useState } from 'react';
import { cachedRunningStats, loadRunningStats } from '../content/cache';
import type { RunningStats } from '../content/types';

/**
 * Loads the running stats from the API: undefined while loading, then the stats, or null on an error
 * or timeout. Unlike page content there is no bundled copy: the stats are extra, so on failure the
 * page simply leaves them out. The page waits for this as well as its content, so the stats don't
 * appear later and push the map and table down. Stats already loaded this visit show at once.
 */
export function useRunningStats(): RunningStats | null | undefined {
  const [stats, setStats] = useState<RunningStats | null | undefined>(cachedRunningStats);

  useEffect(() => {
    if (cachedRunningStats() !== undefined) return;
    let active = true;
    loadRunningStats().then((data) => active && setStats(data));
    return () => {
      active = false;
    };
  }, []);

  return stats;
}
