import type { BrainDumpEntry } from '../braindump/types';
import type { GroupedTimeline } from './types';

// Sorts after any valid HH:MM so timeless entries land at the end of their day
const TIME_END_OF_DAY = '99:99';

function byDateThenTime(a: BrainDumpEntry, b: BrainDumpEntry): number {
  const dateCmp = a.payload.date!.localeCompare(b.payload.date!);
  if (dateCmp !== 0) return dateCmp;
  return (a.payload.time ?? TIME_END_OF_DAY).localeCompare(b.payload.time ?? TIME_END_OF_DAY);
}

export function buildTimelineBuckets(entries: readonly BrainDumpEntry[]): GroupedTimeline {
  const normalized = entries ?? [];

  // Guaranteed by ingest contract: only TASKs can be undated (EVENTs without date are
  // normalized to TASK at the API boundary; NOTEs are always timeless and excluded here).
  const untimed = normalized.filter(e => e.payload.date == null && e.category === 'TASK');

  const timed = normalized
    .filter(e => e.payload.date != null)
    .sort(byDateThenTime);

  const groupedByDate = timed.reduce<Map<string, readonly BrainDumpEntry[]>>((map, entry) => {
    const date = entry.payload.date!;
    map.set(date, [...(map.get(date) ?? []), entry]);
    return map;
  }, new Map());

  const days = Array.from(
    groupedByDate.entries(),
    ([date, dayEntries]) => ({ date, entries: dayEntries }),
  );

  return { days, untimed };
}
