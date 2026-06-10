import type { BrainDumpEntry, EntryCategory } from '../types';

/**
 * Returns entries that match any of the active categories.
 * An empty active set means "no filter" and returns all entries unchanged.
 */
export function applyCategoryFilter(
  entries: readonly BrainDumpEntry[],
  active: readonly EntryCategory[],
): readonly BrainDumpEntry[] {
  if (active.length === 0) return entries;
  const activeSet = new Set(active);
  return entries.filter(e => activeSet.has(e.category));
}
