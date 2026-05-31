/**
 * supabase/functions/process-brain-dump/transcribeAudio.ts
 * * Eine Aufgabe: Audio über die Whisper-API in reinen Text umwandeln.
 */


export async function transcribeAudio(
  audioFile: File,
  openAiKey: string,
): Promise<string> {
  // TODO: FormData bauen (Datei + model "whisper-1")
  // TODO: POST an https://api.openai.com/v1/audio/transcriptions
  // TODO: transkribierten Text zurückgeben

  // ⚠️ Vorher die MIME-Type-Frage unten lesen.
  return ""; // Platzhalter
}