import { useCallback, useEffect, useRef } from 'react';
import { buildPath, parseAppRoute, type AppView } from '../lib/routing';

export type { AppView } from '../lib/routing';

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Bidirectional URL ↔ store sync. The only place in the app that touches
 * window.history and popstate — all other code goes through the store.
 *
 * - Store → URL: replaceState for step navigation (prev/next day);
 *   pushState for jumps (goToToday, setSelectedDate) and view changes.
 * - URL → Store: calls onPop when the user navigates with Back / Forward.
 */
export function useRouteSync(
  view: AppView,
  selectedDate: string,
  navMode: 'step' | 'jump',
  onPop: (view: AppView, date: string | null) => void,
): void {
  const prevViewRef = useRef<AppView>(view);

  useEffect(() => {
    const path = buildPath(view, selectedDate);
    if (window.location.pathname !== path) {
      if (prevViewRef.current !== view || navMode === 'jump') {
        window.history.pushState(null, '', path);
      } else {
        window.history.replaceState(null, '', path);
      }
    }
    prevViewRef.current = view;
  }, [view, selectedDate, navMode]);

  const stableOnPop = useCallback(() => {
    const { view: v, date } = parseAppRoute();
    onPop(v, date);
  }, [onPop]);

  useEffect(() => {
    window.addEventListener('popstate', stableOnPop);
    return () => window.removeEventListener('popstate', stableOnPop);
  }, [stableOnPop]);
}
