/**
 * supabase/functions/process-brain-dump/systemPrompt.ts
 * * Der feste System-Prompt, der die KI in unser JSON-Format zwingt.
 * * Konfiguration, kein Ablauf – getrennt gehalten, damit structureText lesbar bleibt.
 */


import { corsHeaders } from "../_shared/cors";
import { transcribeAudio } from "./transcribeAudio";
import { structureText } from "./structureText";

Deno.serve(async (request) => {
  // TODO: CORS-Preflight (OPTIONS-Request) abfangen -> nur corsHeaders zurückgeben

  // TODO: OpenAI-Key EINMAL lesen: Deno.env.get("OPENAI_API_KEY")
  //       fehlt er -> früh mit 500 abbrechen (Fail Fast)

  // TODO: Input-Typ erkennen und zu EINEM String "rawText" machen:
  //       - multipart/form-data  -> Datei holen, transcribeAudio(...) aufrufen
  //       - application/json      -> { text } aus dem Body lesen

  // TODO: structureText(rawText) aufrufen -> StructuredEntry

  // TODO: Ergebnis gegen den Vertrag prüfen, BEVOR es rausgeht
  //       (category ist TASK/EVENT/NOTE? title da? payload ein Objekt?)

  // TODO: Response mit JSON + corsHeaders zurückgeben
});