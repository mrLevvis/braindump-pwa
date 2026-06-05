/**
 * supabase/functions/_shared/contract.ts
 * * Geteilter KI-Vertrag: Die Typen, die KI-Antwort und Datenbank verbinden.
 * * Wird von allen Edge Functions genutzt (Deno-Pendant zu src/.../types).
 */


/** Die erlaubten Kategorien als Array (= die eine Wahrheit, zur Laufzeit nutzbar). */
export const ENTRY_CATEGORIES = ["TASK", "EVENT", "NOTE"] as const;

/** Der Typ wird aus dem Array ABGELEITET – ändert sich das Array, ändert sich der Typ automatisch. */
export type EntryCategory = typeof ENTRY_CATEGORIES[number];

/**
 * Zeitbezug-Vertrag der Kategorien (erzwungen von normalizeEntryContract):
 *
 * EVENT — per Definition datiert. Ein Event ohne `date` ist ein KI-Fehler;
 *         wird deterministisch zu TASK herabgestuft (bleibt so sichtbar).
 * TASK  — optional datiert. Der einzige flexible Typ.
 * NOTE  — per Definition zeitlos. Datum/Uhrzeit aus der KI-Antwort werden
 *         stillschweigend gestripped; Kategorie bleibt NOTE.
 *
 * Konsumenten downstream (z.B. buildTimelineBuckets) dürfen sich auf diesen
 * Vertrag verlassen, ohne eigene Abwehrlogik zu duplizieren.
 */

/** Die Nutzlast eines Eintrags. */
export interface EntryPayload {
  date?: string;       // YYYY-MM-DD
  startTime?: string;  // HH:MM (Beginn)
  endTime?: string;    // HH:MM (Ende, nur wenn Zeitspanne, > startTime)
  tags?: string[];
}

/** Ein strukturierter Eintrag, wie ihn die KI zurückgibt. */
export interface StructuredEntry {
  category: EntryCategory;
  title: string;
  payload: EntryPayload;
}

/**
 * Normalisiert einen eingehenden StructuredEntry gegen den Zeitbezug-Vertrag.
 * Muss am Ingest-Boundary aufgerufen werden, bevor der Eintrag persistiert wird.
 */
export function normalizeEntryContract(entry: StructuredEntry): StructuredEntry {
  // EVENT ohne Datum ist kein valider Zustand — zu TASK herabstufen.
  if (entry.category === 'EVENT' && !entry.payload.date) {
    return { ...entry, category: 'TASK' };
  }

  // NOTE mit Datum/Uhrzeit: Zeitfelder strippen, Kategorie bleibt NOTE.
  if (entry.category === 'NOTE' && (entry.payload.date || entry.payload.startTime || entry.payload.endTime)) {
    const { date: _d, startTime: _s, endTime: _e, ...stripped } = entry.payload;
    return { ...entry, payload: stripped };
  }

  // endTime muss gültiges HH:MM sein und strikt nach startTime liegen.
  // Ungültiges oder über-Mitternacht-endTime wird verworfen; Eintrag bleibt Punkt-Termin.
  if (entry.payload.endTime != null) {
    const { startTime, endTime } = entry.payload;
    const validFormat = /^\d{2}:\d{2}$/.test(endTime);
    const afterStart = startTime != null && endTime > startTime;
    if (!validFormat || !afterStart) {
      const { endTime: _e, ...withoutEnd } = entry.payload;
      return { ...entry, payload: withoutEnd };
    }
  }

  return entry;
}