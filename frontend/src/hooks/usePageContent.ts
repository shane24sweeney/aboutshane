import { useEffect, useState } from 'react';
import { CONTENT_TIMEOUT_MS, fetchContent } from '../api/content';
import { fallbackContent } from '../content/fallback';
import type { ContentByPage, ContentPage } from '../content/types';

export type PageContentState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T; source: 'api' | 'fallback' };

/** Loads a page's content from the API, falling back to the bundled copy on error or timeout. */
export function usePageContent<P extends ContentPage>(page: P): PageContentState<ContentByPage[P]> {
  const [state, setState] = useState<PageContentState<ContentByPage[P]>>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONTENT_TIMEOUT_MS);
    let active = true;

    fetchContent(page, controller.signal)
      .then((data) => active && setState({ status: 'ready', data, source: 'api' }))
      .catch(() => active && setState({ status: 'ready', data: fallbackContent[page], source: 'fallback' }))
      .finally(() => clearTimeout(timeout));

    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [page]);

  return state;
}
