import { useEffect, useState } from 'react';
import { cachedContent, loadContent } from '../content/cache';
import { fallbackContent } from '../content/fallback';
import type { ContentByPage, ContentPage } from '../content/types';

export type PageContentState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T; source: 'api' | 'fallback' };

/**
 * A page's content from the API, falling back to the bundled copy on error or timeout. Content the
 * visit has already loaded (or prefetched) is shown at once, with no loading state.
 */
export function usePageContent<P extends ContentPage>(page: P): PageContentState<ContentByPage[P]> {
  const [state, setState] = useState<PageContentState<ContentByPage[P]>>(() => {
    const hit = cachedContent(page);
    return hit ? { status: 'ready', data: hit, source: 'api' } : { status: 'loading' };
  });

  useEffect(() => {
    if (cachedContent(page)) return;
    let active = true;
    loadContent(page)
      .then((data) => active && setState({ status: 'ready', data, source: 'api' }))
      .catch(() => active && setState({ status: 'ready', data: fallbackContent[page], source: 'fallback' }));
    return () => {
      active = false;
    };
  }, [page]);

  return state;
}
