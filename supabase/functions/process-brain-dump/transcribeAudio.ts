/**
 * supabase/functions/process-brain-dump/transcribeAudio.ts
 * * Eine Aufgabe: Audio über Groqs Whisper in reinen Text umwandeln.
 */

const GROQ_TRANSCRIPTION_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const WHISPER_MODEL = "whisper-large-v3-turbo";

export async function transcribeAudio(
  audioFile: File,
  groqApiKey: string,
): Promise<string> {
  // TODO: FormData bauen -> file (audioFile) + model (WHISPER_MODEL)
  // TODO: POST an GROQ_TRANSCRIPTION_URL
  //       Header: Authorization: `Bearer ${groqApiKey}`
  //       (kein Content-Type setzen – FormData setzt den Boundary selbst!)
  // TODO: Antwort als JSON lesen und das Feld `text` zurückgeben

  // ⚠️ MIME-Type-Falle: der audioFile MUSS einen Namen mit echter Endung
  //    tragen (z. B. "audio.webm"), sonst lehnt Whisper ab. Siehe Notiz.
  return ""; // Platzhalter
}