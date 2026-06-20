import type { BrainDumpEntry } from '../types';

/**
 * Prüft per DFS, ob das Hinzufügen von `newPredecessorId` als Vorgänger von
 * `entryId` einen Zyklus erzeugen würde.
 */
export function wouldCreateCycle(
  entryId: string,
  newPredecessorId: string,
  allEntries: BrainDumpEntry[],
): boolean {
  const visited = new Set<string>();
  const stack = [newPredecessorId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === entryId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    const entry = allEntries.find(e => e.id === current);
    for (const predId of entry?.dependsOn ?? []) {
      stack.push(predId);
    }
  }
  return false;
}

/** Gibt alle Entries zurück, die `entryId` als Vorgänger haben. */
export function getSuccessors(entryId: string, allEntries: BrainDumpEntry[]): BrainDumpEntry[] {
  return allEntries.filter(e => e.dependsOn?.includes(entryId));
}

/**
 * Sortiert Tasks topologisch (Kahn-Algorithmus) — Vorgänger erscheinen vor Nachfolgern.
 * Berücksichtigt nur Abhängigkeiten innerhalb der übergebenen Task-Liste.
 * Tasks ohne Abhängigkeiten behalten ihre ursprüngliche Reihenfolge.
 * Verbleibende Tasks nach einem Zyklus (sollte nicht vorkommen) werden angehängt.
 */
export function sortTasksTopologically(tasks: BrainDumpEntry[]): BrainDumpEntry[] {
  const taskIds = new Set(tasks.map(t => t.id));
  const inDegree = new Map<string, number>();
  const successorMap = new Map<string, string[]>(); // predecessorId → successorIds

  for (const task of tasks) {
    if (!inDegree.has(task.id)) inDegree.set(task.id, 0);
    if (!successorMap.has(task.id)) successorMap.set(task.id, []);
    for (const predId of task.dependsOn ?? []) {
      if (!taskIds.has(predId)) continue;
      inDegree.set(task.id, (inDegree.get(task.id) ?? 0) + 1);
      if (!successorMap.has(predId)) successorMap.set(predId, []);
      successorMap.get(predId)!.push(task.id);
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const taskById = new Map(tasks.map(t => [t.id, t]));
  const result: BrainDumpEntry[] = [];

  while (queue.length > 0) {
    const id = queue.shift()!;
    const task = taskById.get(id);
    if (task) result.push(task);
    for (const successorId of successorMap.get(id) ?? []) {
      const newDeg = (inDegree.get(successorId) ?? 1) - 1;
      inDegree.set(successorId, newDeg);
      if (newDeg === 0) queue.push(successorId);
    }
  }

  // Verbleibende Tasks anhängen (Zyklus-Fallback)
  for (const task of tasks) {
    if (!result.includes(task)) result.push(task);
  }

  return result;
}

/** Verschiebt ein ISO-Datum (YYYY-MM-DD) um `delta` Tage. */
export function addDays(dateIso: string, delta: number): string {
  const d = new Date(`${dateIso}T00:00:00`);
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Berechnet die Differenz in ganzen Tagen zwischen zwei ISO-Daten (from → to). */
export function calcDeltaDays(fromDate: string, toDate: string): number {
  const from = new Date(`${fromDate}T00:00:00`);
  const to = new Date(`${toDate}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}
