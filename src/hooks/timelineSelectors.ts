import { useMemo } from 'react';
import type { TimelineData } from '../features/timeline';
import { buildTimelineBuckets } from '../features/timeline';
import { useEntries } from './braindumpSelectors';

export function useTimelineBuckets(): TimelineData {
  const entries = useEntries();
  return useMemo(() => buildTimelineBuckets(entries), [entries]);
}
