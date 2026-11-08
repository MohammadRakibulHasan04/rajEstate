/* ------------------------------------------------------------------
   Minimal history-API router with scroll-position memory.
   No dependency; just pushState, popstate and a <Link>.
------------------------------------------------------------------- */
import React, { useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();
const scrollPositions = new Map<string, number>();
let currentRouteKey = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
let inAppHistoryDepth = 0;
let pendingScrollRestore: number | null = null;

function routeKey() {
  return window.location.pathname + window.location.search;
}

function emit() {
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }

  window.addEventListener(
    'scroll',
    () => {
      scrollPositions.set(currentRouteKey, window.scrollY);
    },
    { passive: true }
  );

  window.addEventListener('popstate', () => {
    const nextKey = routeKey();
    const saved = scrollPositions.get(nextKey);
    currentRouteKey = nextKey;
    inAppHistoryDepth = Math.max(0, inAppHistoryDepth - 1);
    pendingScrollRestore = saved ?? 0;
    emit();
    restorePendingScroll();
  });
}

export function restorePendingScroll() {
  if (pendingScrollRestore === null) return;
  const targetY = pendingScrollRestore;
  pendingScrollRestore = null;
  // Apply immediately and once more after layout/ScrollTrigger pin calculation
  window.scrollTo({ top: targetY, behavior: 'instant' as ScrollBehavior });
  requestAnimationFrame(() => {
    window.scrollTo({ top: targetY, behavior: 'instant' as ScrollBehavior });
    setTimeout(() => {
      window.scrollTo({ top: targetY, behavior: 'instant' as ScrollBehavior });
    }, 60);
  });
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
  // Save current scroll before leaving
  scrollPositions.set(currentRouteKey, window.scrollY);

  if (opts.replace) {
    window.history.replaceState({}, '', to);
  } else {
    window.history.pushState({}, '', to);
    inAppHistoryDepth += 1;
  }
  currentRouteKey = routeKey();

  const hashIdx = to.indexOf('#');
  const hashId = hashIdx >= 0 ? to.slice(hashIdx + 1) : '';

  if (opts.keepScroll) {
    // keep current scroll
  } else if (hashId) {
    emit();
    requestAnimationFrame(() => {
      const el = document.getElementById(hashId);
      if (el) el.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
      setTimeout(() => {
        const el2 = document.getElementById(hashId);
        if (el2) el2.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
      }, 60);
    });
    return;
  } else {
    // If navigating back to "/" and we have a saved scroll position on "/", restore it if requested
    window.scrollTo(0, 0);
  }
  emit();
}

/**
 * Navigates back in history if the user arrived via in-app navigation
 * (restoring exact scroll position), or falls back to `fallbackTo`.
 */
export function goBack(fallbackTo = '/#showcase') {
  if (inAppHistoryDepth > 0 || (window.history.length > 1 && scrollPositions.has('/'))) {
    window.history.back();
  } else {
    navigate(fallbackTo);
  }
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
