/**
 * supabase/functions/process-brain-dump/structureText.ts
 * * Hat eine Aufgabe: reinen Text über GPT in den StructuredEntry-Vertrag übersetzen.
 */


import { SYSTEM_PROMPT } from "./systemPrompt";
import type { StructuredEntry } from "../_shared/contract";

export async function structureText(
  rawText: string,
  openAiKey: string,
): Promise<StructuredEntry> {
  // TODO: POST an https://api.openai.com/v1/chat/completions
  //       messages = [ system: SYSTEM_PROMPT, user: rawText ]
  //       response_format: { type: "json_object" }  // erzwingt JSON
  // TODO: JSON-String aus der Antwort parsen
  // TODO: zurückgeben (Validierung passiert im index.ts)

  return {} as StructuredEntry; // Platzhalter
}