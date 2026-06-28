/**
 * supabase/functions/_shared/contract.ts
 * * Geteilter KI-Vertrag: Die Typen, die KI-Antwort und Datenbank verbinden.
 * * Wird von allen Edge Functions genutzt (Deno-Pendant zu src/.../types).
 */


/** Die erlaubten Kategorien als Array (= die eine Wahrheit, zur Laufzeit nutzbar). */
export const ENTRY_CATEGORIES = ["TASK", "EVENT", "NOTE", "SHOPPING"] as const;

/** Shopping-Artikel-Kategorien (geschlossener Enum, eine Wahrheit für die Edge-Function-Laufzeit). */
export const SHOPPING_CATEGORIES = [
  'LEBENSMITTEL',
  'HAUSHALT',
  'ELEKTRONIK',
  'KLEIDUNG',
  'HYGIENE',
  'SONSTIGES',
] as const;
export type ShoppingCategory = typeof SHOPPING_CATEGORIES[number];

/** Shopping-Einheiten (geschlossener Enum). */
export const SHOPPING_UNITS = ['STUECK', 'G', 'KG', 'ML', 'L', 'CM', 'M'] as const;
export type ShoppingUnit = typeof SHOPPING_UNITS[number];

// ─── Recurrence ───────────────────────────────────────────────────────────────

export type RecurrenceFreq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type Weekday = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';
export const WEEKDAYS: readonly Weekday[] = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

export type RecurrenceEnd =
  | { type: 'forever' }
  | { type: 'until'; date: string }   // YYYY-MM-DD, inklusiv
  | { type: 'count'; count: number }; // Gesamtzahl Occurrences ab Start

export interface RecurrenceRule {
  freq:        RecurrenceFreq;
  interval:    number;             // ≥ 1; wie viele Einheiten zwischen den Occurrences
  byDay?:      Weekday[];          // nur bei WEEKLY: konkrete Wochentage
  byMonthPos?: { ordinal: 1 | 2 | 3 | 4 | -1; day: Weekday }; // nur bei MONTHLY positional
  end:         RecurrenceEnd;
}

export function isValidRecurrenceRule(r: unknown): r is RecurrenceRule {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return false;
  const rule = r as Record<string, unknown>;
  const freqs: RecurrenceFreq[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
  if (!freqs.includes(rule.freq as RecurrenceFreq)) return false;
  if (typeof rule.interval !== 'number' || rule.interval < 1) return false;
  if (!rule.end || typeof rule.end !== 'object') return false;
  const end = rule.end as Record<string, unknown>;
  if (!['forever', 'until', 'count'].includes(end.type as string)) return false;
  if (end.type === 'until' && typeof end.date !== 'string') return false;
  if (end.type === 'count' && (typeof end.count !== 'number' || end.count < 1)) return false;
  return true;
}

/** Der Typ wird aus dem Array ABGELEITET – ändert sich das Array, ändert sich der Typ automatisch. */
export type EntryCategory = typeof ENTRY_CATEGORIES[number];

/**
 * Zeitbezug-Vertrag der Kategorien (erzwungen von normalizeEntryContract):
 *
 * EVENT    — per Definition datiert. Ein Event ohne `date` ist ein KI-Fehler;
 *            wird deterministisch zu TASK herabgestuft (bleibt so sichtbar).
 * TASK     — optional datiert. Der einzige flexible Typ.
 * NOTE     — per Definition zeitlos. Datum/Uhrzeit aus der KI-Antwort werden
 *            stillschweigend gestripped; Kategorie bleibt NOTE.
 * SHOPPING — kein Zeitbezug. payload.items enthält die Artikel (KI-angereichert mit
 *            Preisschätzungen); kein DB-Write in der EdgeFn. Der Client zeigt sie im
 *            IngestPreviewSheet, confirmIngest schreibt sie nach Bestätigung in die DB.
 *
 * Konsumenten downstream (z.B. buildTimelineBuckets) dürfen sich auf diesen
 * Vertrag verlassen, ohne eigene Abwehrlogik zu duplizieren.
 */

export const TIME_OF_DAY_VALUES = ['morgens', 'vormittags', 'mittags', 'nachmittags', 'abends', 'nachts'] as const;
export type TimeOfDay = typeof TIME_OF_DAY_VALUES[number];

/** Die Nutzlast eines Eintrags. */
/** Ein Einkaufsartikel mit optionaler KI-Preisschätzung (in EUR), Kategorie und Mengenangabe. */
export interface ShoppingItemEntry {
  label: string;
  estimatedPrice?: number;
  category?: ShoppingCategory;
  count?: number;
  amount?: number;
  unit?: ShoppingUnit;
  parentLabel?: string;
}

export interface EntryPayload {
  date?: string;         // YYYY-MM-DD
  endDate?: string;      // YYYY-MM-DD — nur EVENT; inklusives Enddatum eines Zeitraums
  startTime?: string;    // HH:MM (Beginn)
  endTime?: string;      // HH:MM (Ende, nur wenn Zeitspanne, > startTime)
  deadline?: string;     // HH:MM (Fälligkeit) — nur TASK, wenn explizit "bis [Uhrzeit]" ohne startTime
  timeOfDay?: TimeOfDay; // Grobe Tageszeit wenn keine konkrete Uhrzeit, aber Tageszeitfenster erkennbar
  tags?: string[];
  items?: ShoppingItemEntry[]; // SHOPPING: Liste der Einkaufsartikel mit Preisschätzung
}

/** Ein strukturierter Eintrag, wie ihn die KI zurückgibt. */
export interface StructuredEntry {
  category:    EntryCategory;
  title:       string;
  payload:     EntryPayload;
  sourceExcerpt: string;       // Relevanter Ausschnitt des Original-Dumps für diesen Entry
  summary:     string[];       // Detail-Stichpunkte unterhalb des Titels (mind. 1 Stichpunkt, Pflichtfeld)
  recurrence?: RecurrenceRule; // Nur für EVENT; fehlendes Feld = einmaliger Termin
}

/** Zusatzinfo zu einem bestehenden Nicht-NOTE-Entry — KI-Ausgabe statt separatem NOTE-Entry. */
export interface EntryAdditionalInfo {
  targetEntryId: string;
  content: string;
}

/** Schlanke Repräsentation eines bestehenden Entries als Kontext für den KI-Aufruf. */
export interface ContextEntry {
  id: string;
  title: string;
  category: EntryCategory;
}

/** Root-Objekt der KI-Antwort (Groq json_object-Mode erlaubt kein nacktes Array). */
export interface IngestResponse {
  entries: StructuredEntry[];
  additionalInfos?: EntryAdditionalInfo[];
}

/** Eine UUID pro Dump — serverseitig erzeugt, verbindet alle Entries eines Dumps. */
export type CaptureId = string;

/** Ergebnis des Service nach captureId-Vergabe. */
export interface IngestResult {
  captureId: CaptureId;
  entries: StructuredEntry[];
}

/**
 * Normalisiert einen eingehenden StructuredEntry gegen den Zeitbezug-Vertrag.
 * Muss am Ingest-Boundary aufgerufen werden, bevor der Eintrag persistiert wird.
 */
export function normalizeEntryContract(entry: StructuredEntry): StructuredEntry {
  // SHOPPING hat keinen Zeitbezug — direkt durchreichen, nichts normalisieren.
  if (entry.category === 'SHOPPING') return { ...entry, recurrence: undefined };

  // EVENT ohne Datum ist kein valider Zustand — zu TASK herabstufen.
  if (entry.category === 'EVENT' && !entry.payload.date) {
    return { ...entry, category: 'TASK' };
  }

  // NOTE mit Datum/Uhrzeit: Zeitfelder strippen, Kategorie bleibt NOTE.
  if (entry.category === 'NOTE' && (entry.payload.date || entry.payload.endDate || entry.payload.startTime || entry.payload.endTime || entry.payload.deadline || entry.payload.timeOfDay)) {
    const { date: _d, endDate: _ed, startTime: _s, endTime: _e, deadline: _dl, timeOfDay: _t, ...stripped } = entry.payload;
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

  // endDate nur für EVENT; muss YYYY-MM-DD sein und strikt nach date liegen.
  if (entry.payload.endDate != null) {
    const { date, endDate } = entry.payload;
    const validFormat = /^\d{4}-\d{2}-\d{2}$/.test(endDate);
    const afterStart = date != null && endDate > date;
    if (entry.category !== 'EVENT' || !validFormat || !afterStart) {
      const { endDate: _ed, ...withoutEndDate } = entry.payload;
      return { ...entry, payload: withoutEndDate };
    }
  }

  // deadline muss gültiges HH:MM sein. Ungültiges Format wird verworfen.
  if (entry.payload.deadline != null) {
    if (!/^\d{2}:\d{2}$/.test(entry.payload.deadline)) {
      const { deadline: _dl, ...withoutDeadline } = entry.payload;
      return { ...entry, payload: withoutDeadline };
    }
  }

  // timeOfDay muss ein erlaubter Wert sein. Ungültiger Wert wird verworfen.
  if (entry.payload.timeOfDay != null) {
    if (!(TIME_OF_DAY_VALUES as readonly string[]).includes(entry.payload.timeOfDay)) {
      const { timeOfDay: _t, ...withoutTimeOfDay } = entry.payload;
      return { ...entry, payload: withoutTimeOfDay };
    }
  }

  // recurrence nur für EVENT erlaubt und nur wenn valide.
  const validatedRecurrence = (entry.category === 'EVENT' && isValidRecurrenceRule(entry.recurrence))
    ? entry.recurrence
    : undefined;

  return { ...entry, recurrence: validatedRecurrence };
}