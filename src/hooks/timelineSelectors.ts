import { useMemo } from 'react';
import type { BrainDumpEntry, EntryCategory } from '../features/braindump/types';
import type { TimelineData } from '../features/timeline';
import { buildTimelineBuckets, buildDayMarkers } from '../features/timeline';
import { useDaySelectionStore } from '../features/timeline/store';
import { useEntries } from './braindumpSelectors';

const EMPTY_ENTRIES: readonly BrainDumpEntry[] = [];

export function useTimelineBuckets(): TimelineData {
  const entries = useEntries();
  return useMemo(() => buildTimelineBuckets(entries), [entries]);
}

export function useSelectedDate() {
  return useDaySelectionStore((s) => s.selectedDate);
}

export function useGoToToday() {
  return useDaySelectionStore((s) => s.goToToday);
}

export function useSetSelectedDate() {
  return useDaySelectionStore((s) => s.setSelectedDate);
}

export function useSelectedDayEntries(): readonly BrainDumpEntry[] {
  const { byDate } = useTimelineBuckets();
  const selectedDate = useSelectedDate();
  return byDate.get(selectedDate) ?? EMPTY_ENTRIES;
}

/** Entries for the selected day that have a startTime (placed on the 24h grid). */
export function useSelectedDayTimedEntries(): readonly BrainDumpEntry[] {
  const entries = useSelectedDayEntries();
  return useMemo(() => entries.filter(e => e.payload.startTime != null), [entries]);
}

/** Entries for the selected day that have a date but no startTime (all-day / off-grid). */
export function useDatedTimelessEntries(): readonly BrainDumpEntry[] {
  const entries = useSelectedDayEntries();
  return useMemo(() => entries.filter(e => e.payload.startTime == null), [entries]);
}

/** Map of dateIso → present categories (deterministically ordered), derived from all entries. */
export function useDayMarkers(): ReadonlyMap<string, readonly EntryCategory[]> {
  const entries = useEntries();
  return useMemo(() => {
    const markers = buildDayMarkers(entries);
    const map = new Map<string, readonly EntryCategory[]>();
    for (const m of markers) map.set(m.dateIso, m.categories);
    return map;
  }, [entries]);
}
