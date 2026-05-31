/**
 * supabase/functions/_shared/contract.ts
 * * Geteilter KI-Vertrag: Die Typen, die KI-Antwort und Datenbank verbinden.
 * * Wird von allen Edge Functions genutzt (Deno-Pendant zu src/.../types).
 */


/** Die erlaubten Kategorien als Array (= die eine Wahrheit, zur Laufzeit nutzbar). */
export const ENTRY_CATEGORIES = ["TASK", "EVENT", "NOTE"] as const;

/** Der Typ wird aus dem Array ABGELEITET – ändert sich das Array, ändert sich der Typ automatisch. */
export type EntryCategory = typeof ENTRY_CATEGORIES[number];

/** Die Nutzlast eines Eintrags. */
export interface EntryPayload {
  date?: string;   // YYYY-MM-DD
  time?: string;   // HH:MM
  tags?: string[];
}

/** Ein strukturierter Eintrag, wie ihn die KI zurückgibt. */
export interface StructuredEntry {
  category: EntryCategory;
  title: string;
  payload: EntryPayload;
}