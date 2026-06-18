/**
 * src/features/braindump/types/BrainDump.ts
 * * Domänen-Modelle & Interfaces für das BrainDump Feature.
 */


// ─── Recurrence types (mirror of supabase/functions/_shared/contract.ts) ──────

export type RecurrenceFreq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type Weekday = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';
export const WEEKDAYS: readonly Weekday[] = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
export const WEEKDAY_LABEL_DE: Record<Weekday, string> = {
  MO: 'Mo', TU: 'Di', WE: 'Mi', TH: 'Do', FR: 'Fr', SA: 'Sa', SU: 'So',
};

export type RecurrenceEnd =
  | { type: 'forever' }
  | { type: 'until'; date: string }
  | { type: 'count'; count: number };

export interface RecurrenceRule {
  freq:        RecurrenceFreq;
  interval:    number;
  byDay?:      Weekday[];
  byMonthPos?: { ordinal: 1 | 2 | 3 | 4 | -1; day: Weekday };
  end:         RecurrenceEnd;
}

export type RecurrenceScope = 'single' | 'following' | 'all';

export interface RecurrenceException {
  id:                string;
  series_entry_id:   string;
  original_date:     string;  // YYYY-MM-DD
  type:              'deleted' | 'modified';
  override_entry_id?: string | null;
}

/**
 * Der globale Zustandstyp für das BrainDump-Feature.
 */
export interface BrainDumpState {
  entries: BrainDumpEntry[];
  recurrenceExceptions: RecurrenceException[];
  isRecording: boolean;
  isProcessing: boolean;
  isPrioritizing: boolean;
  pendingPreview: IngestPreview | null;
  /** Ephemere Priorisierung: dateIso → geordnete Task-IDs. Nicht in DB persistiert. */
  prioritizedDays: Record<string, readonly string[]>;
  setRecording: (status: boolean) => void;
  setProcessing: (status: boolean) => void;
  submitText: (text: string) => Promise<void>;
  confirmIngest: (preview: IngestPreview) => Promise<void>;
  discardIngest: (captureId: string) => void;
  deleteEntry: (id: string) => Promise<DeleteResult>;
  deleteEntries: (ids: readonly string[]) => Promise<void>;
  deleteOccurrence: (masterId: string, date: string, scope: RecurrenceScope) => Promise<DeleteResult>;
  updateOccurrence: (masterId: string, date: string, patch: EntryPatch, scope: RecurrenceScope) => Promise<UpdateResult>;
  toggleTaskCompleted: (id: string, completed: boolean) => Promise<ToggleResult>;
  updateEntry: (id: string, patch: EntryPatch) => Promise<UpdateResult>;
  updateEntryList: () => void;
  prioritizeDayTasks: (date: string, tasks: readonly BrainDumpEntry[]) => Promise<void>;
  clearData: () => void;
}

/** Ergebnis der LLM-Priorisierung: geordnete Liste von Entry-IDs. */
export interface PriorityResult {
  orderedTaskIds: string[];
}

/**
 * Das strikte Enum für die Kern-Kategorien (SRP & KISS Prinzip)
 */
export type EntryCategory = 'TASK' | 'EVENT' | 'NOTE' | 'SHOPPING';

/**
 * Der strukturierte Inhalt des JSONB-Feldes in Supabase.
 * Entspricht exakt unserem KI-Vertrag im MVP-Scope.
 */
/** Grobe Tageszeit — gesetzt wenn keine konkrete Uhrzeit genannt, aber ein Tageszeitfenster erkennbar ist. */
export type TimeOfDay = 'morgens' | 'vormittags' | 'mittags' | 'nachmittags' | 'abends' | 'nachts';

export const TIME_OF_DAY_OPTIONS: readonly TimeOfDay[] = ['morgens', 'vormittags', 'mittags', 'nachmittags', 'abends', 'nachts'];

export const TIME_OF_DAY_LABEL: Record<TimeOfDay, string> = {
  morgens:     'Morgens',
  vormittags:  'Vormittags',
  mittags:     'Mittags',
  nachmittags: 'Nachmittags',
  abends:      'Abends',
  nachts:      'Nachts',
};

export interface EntryPayload {
  date?: string;         // ISO Datum (YYYY-MM-DD), falls im Text impliziert/erwähnt
  startTime?: string;    // HH:MM (Beginn), falls im Text erwähnt
  endTime?: string;      // HH:MM (Ende), nur wenn Zeitspanne und > startTime
  deadline?: string;     // HH:MM (Fälligkeit) — nur TASK, wenn explizit "bis [Uhrzeit]" ohne startTime
  timeOfDay?: TimeOfDay; // Grobe Tageszeit wenn keine konkrete Uhrzeit, aber Tageszeitfenster erkennbar
  tags?: string[];       // Flexibler Kontext (z.B. ["Arbeit"])
  items?: Array<string | { label: string; estimatedPrice?: number }>; // SHOPPING: Artikel (string legacy | Objekt mit Preisschätzung)
}

/**
 * Das zentrale Domänen-Modell für einen BrainDump-Eintrag.
 * Dieses Interface verbindet das SQL-Schema (UUID, created_at)
 * mit den strukturierten KI-Daten.
 */
export interface BrainDumpEntry {
  id: string;               // UUID aus Supabase (PRIMARY KEY) — oder `${masterId}__${date}` für virtuelle Occurrences
  created_at: string;
  title?: string;
  original_text: string;
  category: EntryCategory;
  payload: EntryPayload;
  completed: boolean;
  captureId?: string;
  sourceExcerpt?: string;
  summary?: string[];
  recurrence?: RecurrenceRule | null;  // Serien-Master: Regel; Override/einmalig: null/absent
  seriesEntryId?: string | null;       // Override-Instance: ID des Serien-Masters
  // Runtime-only (nicht in DB): werden von expandRecurringSeries gesetzt
  _isVirtualOccurrence?: boolean;
  _occurrenceDate?: string;
  _seriesMasterId?: string;
}

/**
 * DB-seitige Form eines neuen Eintrags (INSERT) — snake_case, entspricht den Spaltennamen.
 * IDs und Zeitstempel werden von der Datenbank generiert.
 * completed muss explizit gesetzt werden: false für TASK, null für EVENT/NOTE.
 */
export interface InsertEntry {
  title?: string;
  original_text: string;
  category: EntryCategory;
  payload: EntryPayload;
  capture_id?: string;
  source_excerpt?: string;
  summary?: string[];
  completed?: boolean | null;
  recurrence?: RecurrenceRule | null;
  series_entry_id?: string | null;
}

/**
 * Diskriminierte Union für das Ergebnis eines DELETE-Calls.
 * not_found: Filter traf 0 Zeilen (kein Fehler, aber auch nichts gelöscht).
 */
export type DeleteResult =
  | { status: 'deleted' }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

/**
 * Diskriminierte Union für das Ergebnis eines TOGGLE-Calls.
 * Analog zu DeleteResult — typsicheres Ergebnis für den completed-Toggle.
 */
export type ToggleResult =
  | { status: 'toggled'; completed: boolean }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

export type UpdateResult =
  | { status: 'updated' }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

export type EntryPatch = Partial<Pick<BrainDumpEntry, 'title' | 'category' | 'payload' | 'summary' | 'recurrence'>>;

/** Ein strukturierter Eintrag, wie ihn die KI zurückgibt. */
export interface StructuredEntry {
  category:    EntryCategory;
  title:       string;
  payload:     EntryPayload;
  sourceExcerpt: string;
  summary:     string[];
  recurrence?: RecurrenceRule;
}

/** Vollständiges Ergebnis der Edge Function nach captureId-Vergabe. */
export interface IngestResult {
  captureId: string;
  entries: StructuredEntry[];
}

/** Ein Entry-Entwurf vor dem DB-Insert — enthält alle Felder außer id und created_at. */
export type EntryDraft = Omit<BrainDumpEntry, 'id' | 'created_at'>;

/** Zustand der Bestätigungs-Preview nach LLM-Verarbeitung, vor DB-Insert. */
export interface IngestPreview {
  captureId: string;
  drafts: EntryDraft[];
}