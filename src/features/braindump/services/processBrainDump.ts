import type { StructuredEntry } from '../types';

const FUNCTION_URL = import.meta.env.VITE_BRAINDUMP_FUNCTION_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Schickt Text an die Edge Function und gibt das strukturierte Entry zurück. */
export async function processText(text: string): Promise<StructuredEntry> {
    // TODO: POST mit JSON-Body { text }, Header apikey + Content-Type
    // TODO: !response.ok -> Error werfen; sonst response.json() zurückgeben
    return {} as StructuredEntry;
}

/** Schickt Audio an die Edge Function und gibt das strukturierte Entry zurück. */
export async function processAudio(blob: Blob): Promise<StructuredEntry> {
    // MIME-FALLE an der Quelle lösen: Blob als audio.webm benennen.
    const audioFile = new File([blob], 'audio.webm', { type: blob.type || 'audio/webm' });
    const formData = new FormData();
    formData.append('file', audioFile);
    // TODO: POST mit formData, Header NUR apikey (kein Content-Type bei FormData!)
    // TODO: !response.ok -> Error werfen; sonst response.json() zurückgeben
    return {} as StructuredEntry;
}