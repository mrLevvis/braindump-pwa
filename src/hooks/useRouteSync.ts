import { useCallback, useEffect, useRef } from 'react';
import { buildPath, parseAppRoute, type AppView } from '../lib/routing';

export type { AppView } from '../lib/routing';

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Bidirectional URL ↔ store sync. The only place in the app that touches
 * window.history and popstate — all other code goes through the store.
 *
 * - Store → URL: pushState only on view changes; replaceState for all day
 *   navigation (steps and jumps alike — days must not fill the history stack).
 * - URL → Store: calls onPop when the user navigates with Back / Forward.
 */
export function useRouteSync(
  view: AppView,
  selectedDate: string,
  onPop: (view: AppView, date: string | null) => void,
): void {
  const prevViewRef = useRef<AppView>(view);

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

  const stableOnPop = useCallback(() => {
    const { view: v, date } = parseAppRoute();
    onPop(v, date);
  }, [onPop]);

  useEffect(() => {
    window.addEventListener('popstate', stableOnPop);
    return () => window.removeEventListener('popstate', stableOnPop);
  }, [stableOnPop]);
}
