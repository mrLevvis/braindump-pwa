/**
 * supabase/functions/process-brain-dump/index.ts
 * * Einstiegspunkt der Function: nimmt den Request an, entscheidet Audio vs. Text
 * * und gibt den validierten Vertrag zurück. Orchestriert nur, enthält keine Logik.
 */

import "@supabase/functions-js/edge-runtime.d.ts";

import { corsHeaders } from "../_shared/cors.ts";
import { structureText } from "./structureText.ts";
import type { StructuredEntry } from "../_shared/contract.ts";
import { ENTRY_CATEGORIES } from "../_shared/contract.ts";
// import { transcribeAudio } from "./transcribeAudio.ts"; // kommt im Audio-Schritt dazu


Deno.serve(async (request) => {


  // 1. CORS-Preflight: Der Browser schickt vor dem echten Request ein "OPTIONS".
  //    Das beantworten wir nur mit den Headern, sonst nichts.
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }


  // 2. Groq-Key holen (Fail Fast: lieber sofort klar abbrechen als später kryptisch).
  const groqApiKey = Deno.env.get("GROQ_API_KEY");
  if (!groqApiKey) {
    return new Response(
      JSON.stringify({ error: "Missing GROQ_API_KEY" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }


  // 3. Nur Text-Pfad (Audio kommt später):
  //    Wir erwarten JSON mit einem Feld "text".
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch (_e) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const rawText = body?.text;
  if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
    return new Response(
      JSON.stringify({ error: "Missing text" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }


  // 4. Den Rohtext von Groq strukturieren lassen.
  let entry: StructuredEntry;
  try {
    entry = await structureText(rawText, groqApiKey);
  } catch (e) {
    const details = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({ error: "AI request failed", details }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }


  // 5. Vertrag prüfen, BEVOR wir antworten (Groq könnte Mist liefern).
  const isValidCategory = ENTRY_CATEGORIES.includes(entry?.category);
  const isValidTitle = typeof entry?.title === "string" && entry.title.trim().length > 0;
  const isValidPayload = entry && typeof entry.payload === "object" && entry.payload !== null && !Array.isArray(entry.payload);

  if (!isValidCategory || !isValidTitle || !isValidPayload) {
    return new Response(
      JSON.stringify({ error: "Invalid AI response", entry }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 6. Alles gut -> den validierten Eintrag als JSON zurückgeben.
  return new Response(JSON.stringify(entry), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});