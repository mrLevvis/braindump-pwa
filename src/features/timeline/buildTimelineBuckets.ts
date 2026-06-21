import type { BrainDumpEntry, RecurrenceException } from '../braindump/types';
import type { TimelineData } from './types';
import { expandRecurringSeries } from './expandRecurringSeries';
import { sortTasksTopologically } from '../braindump/utils/dependencies';
import { shiftDate } from '../../lib/dateUtils';

// Sorts after any valid HH:MM so timeless entries land at the end of their day
const TIME_END_OF_DAY = '99:99';

function expandMultiDayEvent(entry: BrainDumpEntry): BrainDumpEntry[] {
  const { date, endDate, startTime, endTime } = entry.payload;
  if (!date || !endDate || endDate <= date) return [entry];

  // Strip time fields so every occurrence lands in allDay (→ sticky band), not the timed grid.
  // Carry original times as runtime fields so DayGrid can position the vertical line correctly.
  const { startTime: _s, endTime: _e, ...timelessPayload } = entry.payload;
  const timeCarry = {
    _multiDayStartTime: startTime,
    _multiDayEndTime: endTime,
  };

  const result: BrainDumpEntry[] = [{ ...entry, ...timeCarry, payload: timelessPayload }];
  let current = shiftDate(date, 1);
  while (current <= endDate) {
    result.push({
      ...entry,
      ...timeCarry,
      id: `${entry.id}__mde__${current}`,
      _isMultiDayExpansion: true,
      _multiDayStart: date,
      payload: { ...timelessPayload, date: current },
    });
    current = shiftDate(current, 1);
  }
  return result;
}

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

  // Multi-Day-Events (EVENT mit endDate) werden für jeden Tag im Bereich expandiert.
  const multiDayExpanded = regular.flatMap(e =>
    e.category === 'EVENT' && e.payload.endDate ? expandMultiDayEvent(e) : [e]
  );

  // Alle datierten Einträge: reguläre (inkl. Multi-Day-Expansion) + expandierte Occurrences
  const allDated = [...multiDayExpanded, ...expanded].filter(e => e.payload.date != null);

  const undated = sortTasksTopologically(
    regular.filter(e => e.payload.date == null && e.category === 'TASK')
  );

  const byDate = allDated
    .sort(byDateThenTime)
    .reduce<Map<string, readonly BrainDumpEntry[]>>((map, entry) => {
      const date = entry.payload.date!;
      map.set(date, [...(map.get(date) ?? []), entry]);
      return map;
    }, new Map());

  return { byDate, undated };
}
