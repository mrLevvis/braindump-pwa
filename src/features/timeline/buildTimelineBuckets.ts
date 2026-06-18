import type { BrainDumpEntry, RecurrenceException } from '../braindump/types';
import type { TimelineData } from './types';
import { expandRecurringSeries } from './expandRecurringSeries';

// Sorts after any valid HH:MM so timeless entries land at the end of their day
const TIME_END_OF_DAY = '99:99';

function byDateThenTime(a: BrainDumpEntry, b: BrainDumpEntry): number {
  const dateCmp = a.payload.date!.localeCompare(b.payload.date!);
  if (dateCmp !== 0) return dateCmp;
  return (a.payload.startTime ?? TIME_END_OF_DAY).localeCompare(b.payload.startTime ?? TIME_END_OF_DAY);
}

export function buildTimelineBuckets(
  entries: readonly BrainDumpEntry[],
  exceptions: readonly RecurrenceException[] = [],
  windowStart: string = '',
  windowEnd: string = '',
): TimelineData {
  const normalized = entries ?? [];

  // Serien-Master (recurrence != null) werden expandiert, nicht direkt angezeigt.
  // Override-Instances (seriesEntryId != null) erscheinen via expandRecurringSeries.
  const masters   = normalized.filter(e => e.recurrence != null);
  const overrides = normalized.filter(e => e.seriesEntryId != null);
  const regular   = normalized.filter(e => e.recurrence == null && e.seriesEntryId == null);

  // Override-Map für die Expansion: overrideEntryId → BrainDumpEntry
  const overrideMap = new Map(overrides.map(e => [e.id, e]));

  // Expansion aller Serien innerhalb des Fensters
  const expanded = masters.flatMap(master =>
    expandRecurringSeries(master, exceptions, overrideMap, windowStart, windowEnd)
  );

  // Alle datierten Einträge: reguläre + expandierte Occurrences
  const allDated = [...regular, ...expanded].filter(e => e.payload.date != null);

  const undated = regular.filter(e => e.payload.date == null && e.category === 'TASK');

  const byDate = allDated
    .sort(byDateThenTime)
    .reduce<Map<string, readonly BrainDumpEntry[]>>((map, entry) => {
      const date = entry.payload.date!;
      map.set(date, [...(map.get(date) ?? []), entry]);
      return map;
    }, new Map());

  return { byDate, undated };
}
