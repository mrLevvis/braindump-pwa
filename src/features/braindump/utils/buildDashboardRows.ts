import type { BrainDumpEntry } from '../types';

export type DashboardRow =
  | { readonly kind: 'divider'; readonly dateIso: string }
  | { readonly kind: 'entry';   readonly entry: BrainDumpEntry };

function toLocalDateIso(isoStr: string): string {
  const d = new Date(isoStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Sorts entries newest-first and inserts a divider row before the first entry of
 * each new day (i.e. at every day transition, not before the very first group).
 */
export function buildDashboardRows(entries: readonly BrainDumpEntry[]): readonly DashboardRow[] {
  if (entries.length === 0) return [];

  const sorted = [...entries].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const rows: DashboardRow[] = [];
  let lastDate: string | null = null;

  for (const entry of sorted) {
    const dateIso = toLocalDateIso(entry.created_at);
    if (dateIso !== lastDate) {
      if (lastDate !== null) rows.push({ kind: 'divider', dateIso });
      lastDate = dateIso;
    }
    rows.push({ kind: 'entry', entry });
  }

  return rows;
}
