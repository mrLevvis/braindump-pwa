// ─── App routing types & URL helpers ─────────────────────────────────────────
// Single source of truth for URL parsing / path building.
// Imported by the store (DaySelectionStore), the hook (useRouteSync), and App.

export type AppView = 'dashboard' | 'timeline' | 'shopping' | 'admin';
export type AuthPage = 'login' | 'auth-callback';

/** Returns the auth page type if the current URL is an auth route, otherwise null. */
export function currentAuthPage(): AuthPage | null {
  const path = window.location.pathname;
  if (path === '/login') return 'login';
  if (path === '/auth/callback') return 'auth-callback';
  return null;
}

const DATE_SEGMENT = /^\/timeline\/(\d{4}-\d{2}-\d{2})(?:[/?#]|$)/;
const TIMELINE_PREFIX = /^\/timeline(?:[/?#]|$)/;
const SHOPPING_PREFIX = /^\/shopping(?:[/?#]|$)/;
const ADMIN_PREFIX = /^\/admin(?:[/?#]|$)/;

/** Parses the current URL into a view and an optional YYYY-MM-DD date. */
export function parseAppRoute(): { view: AppView; date: string | null } {
  const path = window.location.pathname;
  const dated = DATE_SEGMENT.exec(path);
  if (dated) return { view: 'timeline', date: dated[1] };
  if (TIMELINE_PREFIX.test(path)) return { view: 'timeline', date: null };
  if (SHOPPING_PREFIX.test(path)) return { view: 'shopping', date: null };
  if (ADMIN_PREFIX.test(path)) return { view: 'admin', date: null };
  return { view: 'dashboard', date: null };
}

export function buildPath(view: AppView, date: string): string {
  if (view === 'timeline') return `/timeline/${date}`;
  if (view === 'shopping') return '/shopping';
  if (view === 'admin') return '/admin';
  return '/';
}
