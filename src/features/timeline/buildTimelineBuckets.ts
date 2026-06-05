import type { BrainDumpEntry } from '../braindump/types';
import type { TimelineData } from './types';

// Sorts after any valid HH:MM so timeless entries land at the end of their day
const TIME_END_OF_DAY = '99:99';

function byDateThenTime(a: BrainDumpEntry, b: BrainDumpEntry): number {
  const dateCmp = a.payload.date!.localeCompare(b.payload.date!);
  if (dateCmp !== 0) return dateCmp;
  return (a.payload.startTime ?? TIME_END_OF_DAY).localeCompare(b.payload.startTime ?? TIME_END_OF_DAY);
}

export function buildTimelineBuckets(entries: readonly BrainDumpEntry[]): TimelineData {
  const normalized = entries ?? [];

  // Guaranteed by ingest contract: only TASKs can be undated (EVENTs without date are
  // normalized to TASK at the API boundary; NOTEs are always timeless and excluded here).
  const undated = normalized.filter(e => e.payload.date == null && e.category === 'TASK');

  const byDate = normalized
    .filter(e => e.payload.date != null)
    .sort(byDateThenTime)
    .reduce<Map<string, readonly BrainDumpEntry[]>>((map, entry) => {
      const date = entry.payload.date!;
      map.set(date, [...(map.get(date) ?? []), entry]);
      return map;
    }, new Map());

  return { byDate, undated };
}
