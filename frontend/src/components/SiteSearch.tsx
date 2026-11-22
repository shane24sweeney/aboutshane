import { useEffect, useId, useRef, useState } from 'react';
import { FaMagnifyingGlass } from 'react-icons/fa6';
import { useNavigate } from 'react-router';
import { SEARCH_MAX, SEARCH_MIN, searchSite } from '../api/site';
import type { SearchResult } from '../api/site';
import './SiteSearch.css';

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; query: string; results: SearchResult[] }
  | { status: 'error' };

/** The snippet with each matched word in <mark>, built as elements (never as HTML). */
function Snippet({ text, highlights }: Pick<SearchResult, 'highlights'> & { text: string }) {
  const parts: React.ReactNode[] = [];
  let at = 0;
  for (const { start, length } of highlights) {
    if (start < at || start + length > text.length) continue;
    parts.push(text.slice(at, start), <mark key={start}>{text.slice(start, start + length)}</mark>);
    at = start + length;
  }
  parts.push(text.slice(at));
  return <span className="site-search-snippet">{parts}</span>;
}

/**
 * Searches every page as you type (after a short pause), with results in a list under the box.
 * Arrow keys move through the results, Enter opens one, Escape closes the list, and "/" anywhere
 * on the page jumps to the box.
 */
function SiteSearch() {
  const [query, setQuery] = useState('');
  const [state, setState] = useState<State>({ status: 'idle' });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const listId = useId();

  useEffect(() => {
    const q = query.trim();
    if (q.length < SEARCH_MIN) {
      setState({ status: 'idle' });
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setState({ status: 'loading' });
      searchSite(q, controller.signal)
        .then(({ results }) => setState({ status: 'done', query: q, results }))
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === 'AbortError')) setState({ status: 'error' });
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // "/" focuses the search box, unless the visitor is already typing somewhere.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key !== '/' || target?.closest('input, textarea, [contenteditable="true"]')) return;
      event.preventDefault();
      input.current?.focus();
    };
    const onPointer = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, []);

  const results = state.status === 'done' ? state.results : [];
  const go = (result: SearchResult) => {
    setOpen(false);
    setQuery('');
    input.current?.blur();
    navigate(result.path);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    } else if (event.key === 'ArrowDown' && results.length) {
      event.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % results.length);
    } else if (event.key === 'ArrowUp' && results.length) {
      event.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (event.key === 'Enter' && results.length) {
      event.preventDefault();
      go(results[Math.max(active, 0)]!);
    }
  };

  const showList = open && query.trim().length >= SEARCH_MIN && state.status !== 'idle';

  return (
    <div className="site-search" ref={box} role="search">
      <label className="site-search-field">
        <FaMagnifyingGlass aria-hidden="true" className="site-search-icon" />
        <span className="visually-hidden">Search the site</span>
        <input
          ref={input}
          type="search"
          value={query}
          maxLength={SEARCH_MAX}
          placeholder="Search the site  ( / )"
          autoComplete="off"
          enterKeyHint="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
      </label>
      {showList && (
        <div className="site-search-panel">
          <p className="site-search-status" aria-live="polite">
            {state.status === 'loading' && 'Searching…'}
            {state.status === 'error' && 'Search is unavailable right now. Please try again.'}
            {state.status === 'done' &&
              (results.length ? `${results.length} ${results.length === 1 ? 'match' : 'matches'}` : `No matches for “${state.query}”`)}
          </p>
          {results.length > 0 && (
            <ul className="site-search-results" id={listId} role="listbox" aria-label="Search results">
              {results.map((result, index) => (
                <li
                  key={`${result.path}-${result.title}-${index}`}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  className={index === active ? 'active' : ''}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(result)}
                >
                  <span className="site-search-page">{result.page}</span>
                  <span className="site-search-title">{result.title}</span>
                  <Snippet text={result.snippet} highlights={result.highlights} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default SiteSearch;
