import { createClient, PostgrestError } from '@supabase/supabase-js';
import type { BrainDumpEntry, DeleteResult, EntryAdditionalInfo, EntryPatch, InsertEntry, RecurrenceException, ToggleResult, UpdateResult } from '../types';
import type { ShoppingItemInsertRow } from '../../shopping/services/shoppingItemsService';
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
type BrainDumpEntryRow = Omit<BrainDumpEntry, 'captureId' | 'sourceExcerpt' | 'completed' | 'seriesEntryId' | 'dependsOn' | '_isVirtualOccurrence' | '_occurrenceDate' | '_seriesMasterId'> & {
    capture_id?: string | null;
    source_excerpt?: string | null;
    completed: boolean | null;
    series_entry_id?: string | null;
    depends_on?: string[] | null;
};

function mapRow({ capture_id, source_excerpt, completed, series_entry_id, depends_on, ...rest }: BrainDumpEntryRow): BrainDumpEntry {
    return {
        ...rest,
        completed: completed ?? false,
        captureId: capture_id ?? undefined,
        sourceExcerpt: source_excerpt ?? undefined,
        seriesEntryId: series_entry_id ?? undefined,
        dependsOn: depends_on ?? undefined,
    };
}

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
    return rows.map(mapRow);
}

/**
 * Fügt einen neuen Eintrag in die Datenbank ein und gibt die vollständige Zeile (inkl. generierter ID) zurück.
 */
export async function insertEntry(entry: InsertEntry): Promise<BrainDumpEntry | null> {
    const { data, error } = await supabase
        .from(BRAINDUMP_ENTRIES_DB)
        .insert([entry])
        .select()
        .single();
    const row = handlePostgrestError<BrainDumpEntryRow>('Error inserting entry:', error, data as BrainDumpEntryRow | null);
    return row ? mapRow(row) : null;
}

/**
 * Atomarer Ingest-Commit via Postgres-Transaktion (confirm_ingest RPC).
 * Ersetzt die drei separaten Calls (insertEntries, insertShoppingItemsFromDraft,
 * additionalInfos-Update) durch einen einzigen DB-Roundtrip.
 * Wirft bei DB-Fehler — kein Partial-Commit möglich.
 */
export async function confirmIngestRpc(params: {
    captureId: string;
    entries: readonly InsertEntry[];
    shoppingItems: ShoppingItemInsertRow[];
    additionalInfos: readonly EntryAdditionalInfo[];
}): Promise<void> {
    const { error } = await supabase.rpc('confirm_ingest', {
        p_capture_id:       params.captureId,
        p_entries:          params.entries,
        p_shopping_items:   params.shoppingItems,
        p_additional_infos: params.additionalInfos.map(({ targetEntryId, content }) => ({
            target_entry_id: targetEntryId,
            content,
        })),
    });
    if (error) {
        showErrorToast(`Speichern fehlgeschlagen: ${error.message}`);
        throw new Error(error.message);
    }
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
 * Aktualisiert bearbeitbare Felder eines Eintrags (title, category, payload, summary).
 * dependsOn wird intern herausgefiltert — dafür updateEntryDependsOn verwenden.
 */
export async function updateEntry(id: string, patch: EntryPatch): Promise<UpdateResult> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { dependsOn: _dependsOn, ...dbPatch } = patch;
    const { error, count } = await supabase
        .from(BRAINDUMP_ENTRIES_DB)
        .update(dbPatch, { count: 'exact' })
        .eq('id', id);

    if (error) return { status: 'error', message: error.message };
    if (count === 0) return { status: 'not_found' };
    return { status: 'updated' };
}

/**
 * Aktualisiert die depends_on Spalte eines Eintrags.
 */
export async function updateEntryDependsOn(id: string, dependsOn: string[]): Promise<UpdateResult> {
    const { error, count } = await supabase
        .from(BRAINDUMP_ENTRIES_DB)
        .update({ depends_on: dependsOn }, { count: 'exact' })
        .eq('id', id);

    if (error) return { status: 'error', message: error.message };
    if (count === 0) return { status: 'not_found' };
    return { status: 'updated' };
}

/**
 * Setzt den completed-Status eines Eintrags in der Datenbank.
 */
export async function toggleTaskCompleted(id: string, completed: boolean): Promise<ToggleResult> {
    const { error } = await supabase
        .from(BRAINDUMP_ENTRIES_DB)
        .update({ completed })
        .eq('id', id);

    if (error) return { status: 'error', message: error.message };
    return { status: 'toggled', completed };
}


/**------------------------------------------------------------------------------
 * --- RECURRENCE EXCEPTIONS ---
 * ------------------------------------------------------------------------------*/

const EXCEPTIONS_TABLE = 'recurrence_exceptions';

export async function fetchRecurrenceExceptions(): Promise<RecurrenceException[]> {
    const { data, error } = await supabase
        .from(EXCEPTIONS_TABLE)
        .select('id, series_entry_id, original_date, type, override_entry_id')
        .order('original_date', { ascending: true });
    if (error) {
        showErrorToast(`Fehler beim Laden der Ausnahmen: ${error.message}`);
        return [];
    }
    return (data ?? []) as RecurrenceException[];
}

export async function insertRecurrenceException(
    exc: Omit<RecurrenceException, 'id'>
): Promise<RecurrenceException | null> {
    const { data, error } = await supabase
        .from(EXCEPTIONS_TABLE)
        .insert([exc])
        .select()
        .single();
    if (error) {
        showErrorToast(`Fehler beim Speichern der Ausnahme: ${error.message}`);
        return null;
    }
    return data as RecurrenceException;
}

export async function deleteRecurrenceExceptionsForSeries(
    seriesEntryId: string,
    fromDate?: string  // wenn gesetzt: nur Ausnahmen >= fromDate löschen
): Promise<void> {
    let query = supabase
        .from(EXCEPTIONS_TABLE)
        .delete()
        .eq('series_entry_id', seriesEntryId);
    if (fromDate) query = query.gte('original_date', fromDate);
    const { error } = await query;
    if (error) showErrorToast(`Fehler beim Löschen der Ausnahmen: ${error.message}`);
}