import { useMemo } from 'react';
import type { BrainDumpEntry } from '../features/braindump/types';
import type { TimelineData } from '../features/timeline';
import { buildTimelineBuckets } from '../features/timeline';
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

export function useGoToPreviousDay() {
  return useDaySelectionStore((s) => s.goToPreviousDay);
}

export function useGoToNextDay() {
  return useDaySelectionStore((s) => s.goToNextDay);
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

/** Entries for the selected day that have a date but no startTime (all-day / off-grid). */
export function useDatedTimelessEntries(): readonly BrainDumpEntry[] {
  const entries = useSelectedDayEntries();
  return useMemo(() => entries.filter(e => e.payload.startTime == null), [entries]);
}
