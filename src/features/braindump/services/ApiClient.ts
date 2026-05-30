import { createClient, PostgrestError } from '@supabase/supabase-js';
import type { BrainDumpEntry, InsertEntry } from '../types';

const BRAINDUMP_ENTRIES = 'braindump_entries';
const BRAINDUMP_ENTRIES__MOCK = 'braindump_entries__mock';
const BRAINDUMP_ENTRIES__TEST = 'braindump_entries__test';
const BRAINDUMP_ENTRIES_DB = BRAINDUMP_ENTRIES__TEST

/**------------------------------------------------------------------------------ 
 * --- SUPABASE-CLIENT INITIALISIERUNG ---
 * ------------------------------------------------------------------------------*/

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing Supabase environment variables.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


/**------------------------------------------------------------------------------
 * --- ERROR-HANDLING ---
 * ------------------------------------------------------------------------------*/

function handlePostgrestError<T>(message: string, error: PostgrestError | null) {
    if (error) {
        console.error(message, error);
        return null as T;
    }
}


/**------------------------------------------------------------------------------
 * --- API-FUNKTIONEN ---
 * ------------------------------------------------------------------------------*/

export async function fetchEntries(): Promise<BrainDumpEntry[] | null> {
    const { data, error } = await supabase
        .from(BRAINDUMP_ENTRIES_DB)
        .select('*')
        .order('created_at', { ascending: false });

    handlePostgrestError<BrainDumpEntry[]>('Error fetching entries:', error);
    return data;
}

export async function insertEntry(entry: InsertEntry): Promise<InsertEntry[] | null> {
    const { data, error } = await supabase
        .from(BRAINDUMP_ENTRIES_DB)
        .insert([entry]);

    handlePostgrestError<InsertEntry[]>('Error inserting entry:', error);
    return data;
}