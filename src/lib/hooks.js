import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { store } from '../services/store';
import { t } from '../i18n';

/** Subscribe to a slice of the local prototype store. */
export function useStore(selector) {
  return useSyncExternalStore(store.subscribe, () => selector(store.view()));
}

export function useSession() {
  const id = useStore((s) => s.sessionUserId);
  const users = useStore((s) => s.users);
  return users.find((u) => u.id === id) || null;
}

/**
 * Run an async API call and expose { data, loading, error, reload }.
 * Re-fetches silently (no loading flash) when the underlying store changes.
 */
export function useQuery(fn, deps = []) {
  const [state, setState] = useState({ data: undefined, loading: true, error: null });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const version = useRef(0);

  const run = useCallback((silent) => {
    const v = ++version.current;
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    fnRef.current()
      .then((data) => v === version.current && setState({ data, loading: false, error: null }))
      .catch((error) => v === version.current && setState({ data: undefined, loading: false, error }));
  }, []);

  useEffect(() => {
    run(false);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => store.subscribe(() => run(true)), [run]);

  return { ...state, reload: () => run(false) };
}

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · VERALINK` : `VERALINK — ${t('Connect Talent. Power AI.')}`;
  }, [title]);
}

export function useMediaQuery(query) {
  const get = () => window.matchMedia(query).matches;
  const [match, setMatch] = useState(get);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setMatch(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [query]);
  return match;
}
