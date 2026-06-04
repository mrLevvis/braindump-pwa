import { useMemo } from 'react';
import type { GroupedTimeline } from '../features/timeline';
import { buildTimelineBuckets } from '../features/timeline';
import { useEntries } from './braindumpSelectors';

export function useTimelineBuckets(): GroupedTimeline {
  const entries = useEntries();
  return useMemo(() => buildTimelineBuckets(entries), [entries]);
}
