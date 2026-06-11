/**
 * src/features/braindump/types/BrainDump.ts
 * * Domänen-Modelle & Interfaces für das BrainDump Feature.
 */


/**
 * Der globale Zustandstyp für das BrainDump-Feature.
 * Definiert sowohl die State-Properties als auch die Actions (Mutations).
 * Dieser Vertrag wird von unserem Zustand-Management (z.B. Zustand) implementiert.
 */
export interface BrainDumpState {
  entries: BrainDumpEntry[];
  isRecording: boolean;
  isProcessing: boolean;
  pendingPreview: IngestPreview | null;
  setRecording: (status: boolean) => void;
  setProcessing: (status: boolean) => void;
  submitText: (text: string) => Promise<void>;
  confirmIngest: (preview: IngestPreview) => Promise<void>;
  discardIngest: (captureId: string) => void;
  deleteEntry: (id: string) => Promise<DeleteResult>;
  toggleTaskCompleted: (id: string, completed: boolean) => Promise<ToggleResult>;
  updateEntryList: () => void;
}

/**
 * Das strikte Enum für die Kern-Kategorien (SRP & KISS Prinzip)
 */
export type EntryCategory = 'TASK' | 'EVENT' | 'NOTE';

/**
 * Der strukturierte Inhalt des JSONB-Feldes in Supabase.
 * Entspricht exakt unserem KI-Vertrag im MVP-Scope.
 */
export interface EntryPayload {
  date?: string;       // ISO Datum (YYYY-MM-DD), falls im Text impliziert/erwähnt
  startTime?: string;  // HH:MM (Beginn), falls im Text erwähnt
  endTime?: string;    // HH:MM (Ende), nur wenn Zeitspanne und > startTime
  tags?: string[];     // Flexibler Kontext (z.B. ["Einkauf"])
}

/**
 * Das zentrale Domänen-Modell für einen BrainDump-Eintrag.
 * Dieses Interface verbindet das SQL-Schema (UUID, created_at)
 * mit den strukturierten KI-Daten.
 */
export interface BrainDumpEntry {
  id: string;               // UUID aus Supabase (PRIMARY KEY)
  created_at: string;       // TIMESTAMP WITH TIME ZONE als ISO-String
  title?: string;           // Optionaler Titel, falls von der KI extrahiert
  original_text: string;    // Der volle Rohtext des Dumps (identisch auf allen Entries desselben Dumps)
  category: EntryCategory;  // Das strikte Enum
  payload: EntryPayload;    // Das strukturierte JSON-Objekt
  completed: boolean;       // Mutabler Status — unabhängig vom unveränderlichen Dump-Inhalt
  captureId?: string;       // UUID, die alle Entries desselben Dumps verbindet
  sourceExcerpt?: string;   // Relevanter Wortlaut aus original_text für diesen Entry
  summary?: string[];       // Detail-Stichpunkte (mind. 1 bei neuen Entries; optional/null für Altzeilen vor Migration)
}

/**
 * DB-seitige Form eines neuen Eintrags (INSERT) — snake_case, entspricht den Spaltennamen.
 * IDs, Zeitstempel und completed werden von der Datenbank generiert/defaulted.
 */
export interface InsertEntry {
  title?: string;
  original_text: string;
  category: EntryCategory;
  payload: EntryPayload;
  capture_id?: string;
  source_excerpt?: string;
  summary?: string[];
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

/** Ein strukturierter Eintrag, wie ihn die KI zurückgibt. */
export interface StructuredEntry {
  category: EntryCategory;
  title: string;
  payload: EntryPayload;
  sourceExcerpt: string;
  summary: string[];
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