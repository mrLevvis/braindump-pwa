import { useCallback, useEffect, useRef } from 'react';

export type AppView = 'dashboard' | 'timeline';

// ─── URL parsing / building ───────────────────────────────────────────────────

const DATE_SEGMENT = /^\/timeline\/(\d{4}-\d{2}-\d{2})(?:[/?#]|$)/;
const TIMELINE_PREFIX = /^\/timeline(?:[/?#]|$)/;

export function parseAppRoute(): { view: AppView; date: string | null } {
  const path = window.location.pathname;
  const dated = DATE_SEGMENT.exec(path);
  if (dated) return { view: 'timeline', date: dated[1] };
  if (TIMELINE_PREFIX.test(path)) return { view: 'timeline', date: null };
  return { view: 'dashboard', date: null };
}

function buildPath(view: AppView, date: string): string {
  return view === 'timeline' ? `/timeline/${date}` : '/';
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Bidirectional URL ↔ store sync. The only place in the app that touches
 * window.history and popstate — all other code goes through the store.
 *
 * - Store → URL: pushes a new history entry whenever view or date changes.
 * - URL → Store: calls onPop when the user navigates with Back / Forward.
 */
export function useRouteSync(
  view: AppView,
  selectedDate: string,
  onPop: (view: AppView, date: string | null) => void,
): void {
  const prevViewRef = useRef<AppView>(view);

  // Store → URL: push on view change, replace on day-only change.
  useEffect(() => {
    const path = buildPath(view, selectedDate);
    if (window.location.pathname !== path) {
      if (prevViewRef.current !== view) {
        window.history.pushState(null, '', path);
      } else {
        window.history.replaceState(null, '', path);
      }
    }
    prevViewRef.current = view;
  }, [view, selectedDate]);

  // URL → Store (Back / Forward)
  const stableOnPop = useCallback(() => {
    const { view: v, date } = parseAppRoute();
    onPop(v, date);
  }, [onPop]);

  useEffect(() => {
    window.addEventListener('popstate', stableOnPop);
    return () => window.removeEventListener('popstate', stableOnPop);
  }, [stableOnPop]);
}
