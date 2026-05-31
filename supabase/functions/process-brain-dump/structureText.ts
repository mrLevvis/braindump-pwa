/**
 * supabase/functions/process-brain-dump/structureText.ts
 * * Eine Aufgabe: reinen Text über Groqs Llama in den StructuredEntry-Vertrag übersetzen.
 */

import { SYSTEM_PROMPT } from "./systemPrompt";
import type { StructuredEntry } from "../_shared/contract";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "llama-3.3-70b-versatile";

export async function structureText(
  rawText: string,
  groqApiKey: string,
): Promise<StructuredEntry> {
  // TODO: POST an GROQ_CHAT_URL
  //       Header: Authorization: `Bearer ${groqApiKey}`, Content-Type: application/json
  //       Body:
  //         model: TEXT_MODEL
  //         messages: [
  //           { role: "system", content: SYSTEM_PROMPT },
  //           { role: "user",   content: rawText },
  //         ]
  //         response_format: { type: "json_object" }   // erzwingt reines JSON
  // TODO: aus der Antwort choices[0].message.content lesen (ist ein JSON-String)
  // TODO: diesen String mit JSON.parse(...) zu einem Objekt machen und zurückgeben
  //       (die Vertrags-Prüfung passiert im index.ts)

  return {} as StructuredEntry; // Platzhalter
}