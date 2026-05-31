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

  // 1. FormData bauen: die Audio-Datei + das gewünschte Modell.
  const formData = new FormData();
  formData.append("file", audioFile);
  formData.append("model", WHISPER_MODEL);

  // 2. An Groqs Whisper schicken.
  //    WICHTIG: KEIN "Content-Type"-Header! Bei FormData setzt fetch den
  //    multipart-Boundary selbst – manuell gesetzt zerstört es den Upload.
  const response = await fetch(GROQ_TRANSCRIPTION_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${groqApiKey}`,
    },
    body: formData,
  });

  // 3. Hat Whisper erfolgreich geantwortet?
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq transcription failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  // 4. Antwort auspacken. Whisper liefert { "text": "..." }.
  const data = await response.json();
  const transcribedText = data.text;

  // 5. Sicherstellen, dass wirklich Text da ist.
  if (!transcribedText || typeof transcribedText !== "string" || !transcribedText.trim()) {
    throw new Error("Empty transcription from Groq");
  }

  // 6. Den reinen Text zurückgeben (das Strukturieren macht structureText).
  return transcribedText;
}