/* ------------------------------------------------------------------
   Minimal history-API router. No dependency; just pushState,
   popstate and a <Link>. Supports `:param` segments.
------------------------------------------------------------------- */
import React, { useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', emit);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getPath() {
  return window.location.pathname;
}

export function usePath(): string {
  return useSyncExternalStore(subscribe, getPath, getPath);
}

export function navigate(to: string, opts: { replace?: boolean; keepScroll?: boolean } = {}) {
  if (to === window.location.pathname + window.location.search + window.location.hash) return;
  if (opts.replace) window.history.replaceState({}, '', to);
  else window.history.pushState({}, '', to);
  if (!opts.keepScroll && !to.includes('#')) window.scrollTo(0, 0);
  emit();
}

/** Returns params on match, otherwise null. Pattern: "/property/:slug" */
export function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split('/').filter(Boolean);
  const s = path.replace(/\/+$/, '').split('/').filter(Boolean);
  if (p.length !== s.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(s[i]);
    else if (p[i] !== s[i]) return null;
  }
  return params;
}

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; replace?: boolean };

export const Link: React.FC<LinkProps> = ({ to, replace, onClick, children, ...rest }) => (
  <a
    href={to}
    onClick={(e) => {
      onClick?.(e);
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (rest.target === '_blank') return;
      e.preventDefault();
      navigate(to, { replace });
    }}
    {...rest}
  >
    {children}
  </a>
);

/** Sets document title + meta description for the current view. */
export function useDocumentMeta(title: string, description?: string) {
  React.useEffect(() => {
    const prevTitle = document.title;
    document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute('content') ?? '';
    if (description && meta) meta.setAttribute('content', description);
    return () => {
      document.title = prevTitle;
      if (meta) meta.setAttribute('content', prevDesc);
    };
  }, [title, description]);
}
