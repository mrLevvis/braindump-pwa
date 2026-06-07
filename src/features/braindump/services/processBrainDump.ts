/**
 * features/braindump/services/processBrainDump.ts
 * Diese Datei enthält Funktionen, die mit der Edge Function kommunizieren, um Texte zu strukturieren oder Audios zu transkribieren. Sie ist von der konkreten Implementierung der Function entkoppelt und könnte theoretisch auch in einem anderen Kontext liegen.
 * Die Funktion processText schickt einen Text an die Edge Function und gibt den strukturierten Eintrag zurück. Die Funktion transcribeAudio schickt eine Audiodatei an die Edge Function, lässt sie transkribieren und gibt den Text zurück.
 * Beide Funktionen werfen Fehler, wenn die Anfrage fehlschlägt, damit der Aufrufer (z.B. der BrainDumpDashboard) entsprechend reagieren kann.
 */

import type { IngestResult } from '../types';

const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function resolveFunctionUrl(): string {
    const directFunctionUrl = import.meta.env.VITE_BRAINDUMP_FUNCTION_URL?.trim();
    if (directFunctionUrl) return directFunctionUrl;

    const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL?.trim();
    if (functionsUrl) return functionsUrl;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
    if (!supabaseUrl) {
        throw new Error('Missing function URL. Set VITE_BRAINDUMP_FUNCTION_URL or VITE_SUPABASE_FUNCTIONS_URL (or VITE_SUPABASE_URL).');
    }

    return `${supabaseUrl}/functions/v1/process-brain-dump`;
}

const FUNCTION_URL = resolveFunctionUrl();

if (!ANON_KEY) {
    throw new Error('Missing VITE_SUPABASE_ANON_KEY.');
}

/**
 * Schickt einen Text an die Edge Function und gibt das Ingest-Ergebnis zurück.
 * Das Ergebnis enthält eine captureId und ein Array von strukturierten Entries.
 */
export async function processText(text: string): Promise<IngestResult> {
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

/**
 * Schickt eine Audiodatei an die Edge Function, lässt sie transkribieren und gibt den Text zurück.
 * @param audioBlob Die Audiodatei als Blob.
 * @returns Das transkribierte Audio als String.
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
    // MIME-Falle an der Quelle lösen: Blob bekommt einen Namen mit Endung,
    // damit Whisper das Format erkennt.
    const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });

    const formData = new FormData();
    formData.append('file', audioFile);

    const response = await fetch(FUNCTION_URL, {
        method: 'POST',
        // KEIN Content-Type setzen! Bei FormData setzt fetch den
        // multipart-Boundary selbst – manuell gesetzt zerstört den Upload.
        headers: { apikey: ANON_KEY },
        body: formData,
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error ?? `Request failed: ${response.status}`);
    }

    // { text: "..." } auspacken → reiner String für das Textfeld.
    const data = await response.json();
    return data.text;
}