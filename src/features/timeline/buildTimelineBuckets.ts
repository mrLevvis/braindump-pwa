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

  // Only undated TASKs go here — EVENTs and NOTEs without a date are not shown in the timeline view
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
