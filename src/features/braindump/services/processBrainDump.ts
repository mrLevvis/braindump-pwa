/**
 * features/braindump/services/processBrainDump.ts
 * Diese Datei enthält Funktionen, die mit der Edge Function kommunizieren, um Texte zu strukturieren oder Audios zu transkribieren. Sie ist von der konkreten Implementierung der Function entkoppelt und könnte theoretisch auch in einem anderen Kontext liegen.
 * Die Funktion processText schickt einen Text an die Edge Function und gibt den strukturierten Eintrag zurück. Die Funktion transcribeAudio schickt eine Audiodatei an die Edge Function, lässt sie transkribieren und gibt den Text zurück.
 * Beide Funktionen werfen Fehler, wenn die Anfrage fehlschlägt, damit der Aufrufer (z.B. der BrainDumpDashboard) entsprechend reagieren kann.
 */

import type { StructuredEntry } from '../types';

const FUNCTION_URL = import.meta.env.VITE_BRAINDUMP_FUNCTION_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Schickt einen Text an die Edge Function und gibt den strukturierten Eintrag zurück. Der Vertrag ist in ../_shared/contract.ts definiert.
 * Die Funktion ist "dumm": Sie kümmert sich nur um die Kommunikation, nicht um die Logik. Sie könnte genauso gut in einem anderen Kontext liegen.
 * @param text Der Rohtext, der strukturiert werden soll.
 * @returns Der strukturierte Eintrag.
 */
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