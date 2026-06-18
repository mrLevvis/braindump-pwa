import type { BrainDumpEntry, EntryCategory } from '../braindump/types';
import { todayLocal } from '../../lib/dateUtils';

const CATEGORY_ORDER: readonly EntryCategory[] = ['TASK', 'EVENT', 'NOTE', 'SHOPPING'];

export interface DayMarker {
  readonly dateIso: string;
  readonly categories: readonly EntryCategory[];
  readonly isToday: boolean;
}

export function buildDayMarkers(entries: readonly BrainDumpEntry[]): readonly DayMarker[] {
  const today = todayLocal();
  const byDate = new Map<string, Set<EntryCategory>>();

  for (const entry of entries) {
    const date = entry.payload.date;
    if (!date) continue;
    let set = byDate.get(date);
    if (!set) { set = new Set(); byDate.set(date, set); }
    set.add(entry.category);
  }

  return Array.from(byDate.entries()).map(([dateIso, cats]) => ({
    dateIso,
    categories: CATEGORY_ORDER.filter(c => cats.has(c)),
    isToday: dateIso === today,
  }));
}
