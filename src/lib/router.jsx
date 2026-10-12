// Minimal history router — no dependency. Routes look like "/opportunities/vl-104?ref=home".
// Static hosts must serve index.html for unknown paths (SPA fallback); Vite's dev server does.
import { createContext, useContext, useEffect, useState } from 'react';

const RouterContext = createContext(null);
const EVENT = 'locationchange';

// Links shared before the switch from hash routing ("#/opportunities") still work.
if (window.location.hash.startsWith('#/')) {
  window.history.replaceState(null, '', window.location.hash.slice(1));
}

function parseLocation() {
  return { path: window.location.pathname || '/', query: new URLSearchParams(window.location.search) };
}

export function navigate(to, { replace = false } = {}) {
  if (replace) window.history.replaceState(null, '', to);
  else window.history.pushState(null, '', to);
  window.dispatchEvent(new Event(EVENT));
}

export function RouterProvider({ children }) {
  const [location, setLocation] = useState(parseLocation);

  useEffect(() => {
    const onChange = () => {
      const next = parseLocation();
      setLocation((prev) => {
        if (prev.path !== next.path) window.scrollTo({ top: 0, behavior: 'instant' });
        return next;
      });
    };
    window.addEventListener(EVENT, onChange);
    window.addEventListener('popstate', onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener('popstate', onChange);
    };
  }, []);

  return <RouterContext.Provider value={location}>{children}</RouterContext.Provider>;
}

export function useLocation() {
  return useContext(RouterContext);
}

/** Match a pattern like "/app/applications/:id" (or a prefix pattern "/login/*") against a path. */
export function matchPath(pattern, path) {
  const p = pattern.split('/').filter(Boolean);
  const s = path.split('/').filter(Boolean);
  const wildcard = p[p.length - 1] === '*';
  if (wildcard) p.pop();
  if (wildcard ? s.length < p.length : p.length !== s.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(s[i]);
    else if (p[i] !== s[i]) return null;
  }
  return params;
}

export function Link({ to, children, className, activeExact, onClick, ...rest }) {
  const { path } = useLocation();
  const target = to.split('?')[0];
  const isActive = activeExact ? path === target : path === target || (target !== '/' && path.startsWith(target + '/'));
  return (
    <a
      href={to}
      className={className}
      aria-current={rest['data-nav'] && isActive ? 'page' : undefined}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
