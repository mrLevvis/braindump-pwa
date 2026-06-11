import { createClient, PostgrestError } from '@supabase/supabase-js';
import type { BrainDumpEntry, DeleteResult, InsertEntry, ToggleResult } from '../types';
import { showErrorToast } from '../../../hooks/useErrorToast';

//const BRAINDUMP_ENTRIES = 'braindump_entries';
//const BRAINDUMP_ENTRIES__MOCK = 'braindump_entries__mock';
const BRAINDUMP_ENTRIES__TEST = 'braindump_entries__test';
const BRAINDUMP_ENTRIES_DB = BRAINDUMP_ENTRIES__TEST

/**------------------------------------------------------------------------------ 
 * --- SUPABASE-CLIENT INITIALISIERUNG ---
 * ------------------------------------------------------------------------------*/

/** Supabase URL und Key aus den Umgebungsvariablen */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Überprüft, ob die Supabase-Umgebungsvariablen gesetzt sind */
if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing Supabase environment variables.');
}

/** Supabase-Client */
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


/**------------------------------------------------------------------------------
 * --- ERROR-HANDLING ---
 * ------------------------------------------------------------------------------*/

/**
 * Gibt data zurück, wenn kein Fehler vorliegt, sonst loggt und gibt null zurück.
 * @param message Fehlermeldung, die geloggt wird, wenn ein Fehler auftritt.
 * @param error Das PostgrestError-Objekt, das von Supabase zurückgegeben wird.
 * @param data Die Daten, die zurückgegeben werden sollen, wenn kein Fehler vorliegt.
 * @returns Die Daten oder null, wenn ein Fehler auftritt.
 */
function handlePostgrestError<T>(message: string, error: PostgrestError | null, data: T | null): T | null {
    if (error) {
        const details = [error.code, error.details, error.hint].filter(Boolean).join(' | ');
        const fullMessage = details ? `${message} ${error.message} (${details})` : `${message} ${error.message}`;
        showErrorToast(fullMessage);
        return null as T | null;
    }
    return data;
}


/**------------------------------------------------------------------------------
 * --- API-FUNKTIONEN ---
 * ------------------------------------------------------------------------------*/

/** Raw DB row returned by Supabase — snake_case column names, nullable new columns. */
type BrainDumpEntryRow = Omit<BrainDumpEntry, 'captureId' | 'sourceExcerpt' | 'completed'> & {
    capture_id?: string | null;
    source_excerpt?: string | null;
    completed: boolean | null;
};

/**
 * Fetcht alle brain dump entries aus der Datenbank, sortiert nach Erstellungsdatum (neueste zuerst).
 * @returns Ein Array von BrainDumpEntry-Objekten oder null, wenn ein Fehler auftritt.
 */
export async function fetchEntries(): Promise<BrainDumpEntry[] | null> {
    const { data, error } = await supabase
        .from(BRAINDUMP_ENTRIES_DB)
        .select('*')
        .order('created_at', { ascending: false });
    const rows = handlePostgrestError<BrainDumpEntryRow[]>('Error fetching entries:', error, data as BrainDumpEntryRow[] | null);
    if (!rows) return null;
    return rows.map(({ capture_id, source_excerpt, completed, ...rest }) => ({
        ...rest,
        completed: completed ?? false,
        captureId: capture_id ?? undefined,
        sourceExcerpt: source_excerpt ?? undefined,
    }));
}

/**
 * Fügt einen neuen Eintrag in die Datenbank ein.
 * @param entry Das InsertEntry-Objekt, das die Daten des neuen Eintrags enthält.
 * @returns Ein Array mit dem eingefügten Eintrag oder null, wenn ein Fehler auftritt.
 */
export async function insertEntry(entry: InsertEntry): Promise<InsertEntry | null> {
    const { data, error } = await supabase
        .from(BRAINDUMP_ENTRIES_DB)
        .insert([entry]);
    return handlePostgrestError<InsertEntry>('Error inserting entry:', error, data);
}

/**
 * Fügt mehrere Einträge eines Dumps in einer einzigen Operation ein (Batch-Insert).
 * Wirft bei DB-Fehler — der Aufrufer ist für All-or-Nothing-Semantik verantwortlich.
 */
export async function insertEntries(entries: readonly InsertEntry[]): Promise<void> {
    const { error } = await supabase
        .from(BRAINDUMP_ENTRIES_DB)
        .insert(entries as InsertEntry[]);
    if (error) {
        showErrorToast(`Error inserting entries: ${error.message}`);
        throw new Error(error.message);
    }
}

/**
 * Loescht einen bestehenden Eintrag per ID aus der Datenbank.
 * @param id Die UUID des Eintrags.
 * @returns DeleteResult: 'deleted' | 'not_found' | 'error'
 */
export async function deleteEntry(id: string): Promise<DeleteResult> {
    const { error, count } = await supabase
        .from(BRAINDUMP_ENTRIES_DB)
        .delete({ count: 'exact' })
        .eq('id', id);

    if (error) return { status: 'error', message: error.message };
    if (count === 0) return { status: 'not_found' };
    return { status: 'deleted' };
}

/**
 * Loescht mehrere Eintraege per IDs in einem einzigen DB-Request (all-or-nothing).
 * Wirft bei DB-Fehler.
 */
export async function deleteEntriesByIds(ids: readonly string[]): Promise<void> {
    const { error } = await supabase
        .from(BRAINDUMP_ENTRIES_DB)
        .delete()
        .in('id', ids as string[]);
    if (error) {
        showErrorToast(`Error deleting entries: ${error.message}`);
        throw new Error(error.message);
    }
}

/**
 * Setzt den completed-Status eines Eintrags in der Datenbank.
 * @param id Die UUID des Eintrags.
 * @param completed Der neue completed-Status.
 * @returns ToggleResult: 'toggled' | 'not_found' | 'error'
 */
export async function toggleTaskCompleted(id: string, completed: boolean): Promise<ToggleResult> {
    const { error } = await supabase
        .from(BRAINDUMP_ENTRIES_DB)
        .update({ completed })
        .eq('id', id);

    if (error) return { status: 'error', message: error.message };
    return { status: 'toggled', completed };
}