/**
 * supabase/functions/process-brain-dump/structureText.ts
 * Eine Aufgabe: reinen Text über Groqs Llama in den StructuredEntry-Vertrag übersetzen.
 * Wird von process-brain-dump (Erst-Ingest) und reprocess-entry (Nachbearbeitung) geteilt.
 */

import { buildSystemPrompt } from "./systemPrompt.ts";
import type { IngestResponse } from "../_shared/contract.ts";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "llama-3.3-70b-versatile";

export async function structureText(
  rawText: string,
  groqApiKey: string,
): Promise<IngestResponse> {

  // 1. Anfrage an Groq schicken.
  const response = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${groqApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: TEXT_MODEL,
      messages: [
        { role: "system", content: buildSystemPrompt(getTodayIso()) },
        { role: "user", content: rawText },
      ],
      response_format: { type: "json_object" }, // zwingt Groq zu reinem JSON
    }),
  });

  // 2. Hat Groq überhaupt erfolgreich geantwortet?
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq API request failed: ${response.status} ${response.statusText} - ${text}`);
  }

  // 3. Die Antwort-Hülle von Groq auspacken.
  const data = await response.json();

  // Groq verpackt das Ergebnis verschachtelt. Der eigentliche Inhalt liegt hier:
  const content = data.choices?.[0]?.message?.content;

  if (!content || typeof content !== "string" || content.trim() === "") {
    throw new Error("Empty response from Groq");
  }

  // 4. content ist ein JSON-STRING -> in ein echtes Objekt verwandeln.
  let parsed: IngestResponse;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    throw new Error(`Failed to parse Groq response as JSON: ${(err as Error).message}\nContent: ${content}`);
  }

  // 5. Das Objekt zurückgeben.
  //    KEINE Vertrags-Validierung hier – die macht index.ts (Schritt 5 dort).
  return parsed;
}


/**------------------------------------------------------------------------------ 
 * --- INTERNAL HELPER FUNCTIONS ---
 * ------------------------------------------------------------------------------*/

/**
 * Gibt das heutige Datum im ISO-Format (YYYY-MM-DD) in der Zeitzone Europe/Berlin zurück.
 * new Date().toISOString() wäre UTC und kann für deutsche Nutzer kurz nach Mitternacht
 * den falschen Tag liefern.
 */
function getTodayIso(): string {
  return new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()).split('.').reverse().join('-');
  // de-DE liefert "TT.MM.JJJJ" → split+reverse → "JJJJ-MM-TT"
}