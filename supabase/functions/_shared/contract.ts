/**
 * supabase/functions/_shared/contract.ts
 * * Geteilter KI-Vertrag: Die Typen, die KI-Antwort und Datenbank verbinden.
 * * Wird von allen Edge Functions genutzt (Deno-Pendant zu src/.../types).
 */


export type EntryCategory = "TASK" | "EVENT" | "NOTE";

export interface EntryPayload {
  date?: string;   // YYYY-MM-DD
  time?: string;   // HH:MM
  tags?: string[];
}

// Exakt das, was die KI zurückgeben MUSS (= was das Frontend erwartet).
export interface StructuredEntry {
  category: EntryCategory;
  title: string;
  payload: EntryPayload;
}