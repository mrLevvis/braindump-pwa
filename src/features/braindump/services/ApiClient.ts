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

/**
 * Fetcht alle brain dump entries aus der Datenbank, sortiert nach Erstellungsdatum (neueste zuerst).
 * @returns Ein Array von BrainDumpEntry-Objekten oder null, wenn ein Fehler auftritt.
 */
export async function fetchEntries(): Promise<BrainDumpEntry[] | null> {
    const { data, error } = await supabase
        .from(BRAINDUMP_ENTRIES_DB)
        .select('*')
        .order('created_at', { ascending: false });
    return handlePostgrestError<BrainDumpEntry[]>('Error fetching entries:', error, data);
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