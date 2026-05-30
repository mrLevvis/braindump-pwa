import { createClient, PostgrestError } from '@supabase/supabase-js';
import type { BrainDumpEntry, InsertEntry } from '../types';

const BRAINDUMP_ENTRIES = 'braindump_entries';
const BRAINDUMP_ENTRIES__MOCK = 'braindump_entries__mock';
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
 * Handles Postgrest errors by logging them and returning null.
 * @param message The error message to be logged.
 * @param error The PostgrestError object.
 * @returns Null if an error occurs.
 */
function handlePostgrestError<T>(message: string, error: PostgrestError | null) {
    if (error) {
        console.error(message, error);
        return null as T;
    }
}


/**------------------------------------------------------------------------------
 * --- API-FUNKTIONEN ---
 * ------------------------------------------------------------------------------*/

/**
 * Fetches all brain dump entries from the database.
 * @returns An array of BrainDumpEntry objects or null if an error occurs.
 */
export async function fetchEntries(): Promise<BrainDumpEntry[] | null> {
    const { data, error } = await supabase
        .from(BRAINDUMP_ENTRIES_DB)
        .select('*')
        .order('created_at', { ascending: false });

    handlePostgrestError<BrainDumpEntry[]>('Error fetching entries:', error);
    return data;
}

/**
 * Inserts a new brain dump entry into the database.
 * @param entry The entry to be inserted.
 * @returns The inserted entry or null if an error occurs.
 */
export async function insertEntry(entry: InsertEntry): Promise<InsertEntry[] | null> {
    const { data, error } = await supabase
        .from(BRAINDUMP_ENTRIES_DB)
        .insert([entry]);

    handlePostgrestError<InsertEntry[]>('Error inserting entry:', error);
    return data;
}