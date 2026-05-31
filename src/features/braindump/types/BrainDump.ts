import type { RecordingSlice } from './Recording';

/**
 * src/features/braindump/types/BrainDump.ts
 * * Domänen-Modelle & Interfaces für das BrainDump Feature.
 */


/**
 * Der globale Zustandstyp für das BrainDump-Feature.
 * Definiert sowohl die State-Properties als auch die Actions (Mutations).
 * Dieser Vertrag wird von unserem Zustand-Management (z.B. Zustand) implementiert.
 */
export interface BrainDumpState extends RecordingSlice {
  entries: BrainDumpEntry[];
  isRecording: boolean;
  isProcessing: boolean;
  setRecording: (status: boolean) => void;
  setProcessing: (status: boolean) => void;
  submitText: (text: string) => Promise<void>;
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
  date?: string;   // ISO Datum (YYYY-MM-DD), falls im Text impliziert/erwähnt
  time?: string;   // Uhrzeit (HH:MM), falls im Text erwähnt
  tags?: string[]; // Flexibler Kontext (z.B. ["Einkauf"])
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
  original_text: string;    // Der Rohtext, den der Nutzer eingegeben hat
  category: EntryCategory;  // Das strikte Enum
  payload: EntryPayload;    // Das strukturierte JSON-Objekt
}

/**
 * Hilfs-Typ für das Erstellen eines neuen Eintrags (INSERT).
 * IDs und Zeitstempel werden von der Datenbank (Supabase) generiert,
 * daher fehlen diese Felder hier.
 */
export type InsertEntry = Omit<BrainDumpEntry, 'id' | 'created_at'>;

/**
 * Der strukturierte Eintrag, den wir von der KI zurückbekommen.
 * Dieser Vertrag definiert die Daten, die unsere Edge Function nach der Verarbeitung des Textes oder Audios zurückgibt.
 * Er entspricht unserem KI-Vertrag und wird in unserem Zustand-Management verwendet, um die Einträge zu aktualisieren.
 * In zukünftigen Iterationen könnte dieser Vertrag erweitert werden, wenn die KI mehr Informationen extrahieren kann.
 */
export interface StructuredEntry {
  category: EntryCategory;
  title: string;
  payload: EntryPayload;
}