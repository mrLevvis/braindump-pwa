/**
 * features/braindump/services/processBrainDump.ts
 * * Eine Aufgabe: Rohtext an die Edge Function schicken und das
 * * strukturierte StructuredEntry zurückgeben.
 */

import type { StructuredEntry } from '../types';

const FUNCTION_URL = import.meta.env.VITE_BRAINDUMP_FUNCTION_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function processText(text: string): Promise<StructuredEntry> {
    const response = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
            apikey: ANON_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });

    if (!response.ok) {
        // Backend liefert { error, details } – die Meldung mitnehmen, hilft beim Debuggen.
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error ?? `Request failed: ${response.status}`);
    }

    return response.json();
}