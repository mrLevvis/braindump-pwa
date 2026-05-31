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
import { transcribeAudio } from "./transcribeAudio.ts";


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


  // 3. Input-Typ erkennen und in EINEN String "rawText" verwandeln.
  //    - multipart/form-data -> Audio -> erst transkribieren
  //    - application/json     -> Text  -> direkt nehmen
  const contentType = request.headers.get("content-type") ?? "";
  let rawText: string;

  try {
    if (contentType.includes("multipart/form-data")) {
      // --- Audio-Pfad ---
      const formData = await request.formData();
      const audioInput = formData.get("file");

      // Sicherstellen, dass wirklich eine Datei kam (nicht nur Text/leer).
      if (!(audioInput instanceof File)) {
        return new Response(
          JSON.stringify({ error: "Missing audio file" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // MIME-FALLE: Whisper erkennt das Format am Dateinamen. Hat die Datei
      // keine (oder keine brauchbare) Endung, packen wir sie sicherheitshalber
      // in eine neue File mit passendem Namen um.
      const safeAudioFile = ensureFileName(audioInput);

      rawText = await transcribeAudio(safeAudioFile, groqApiKey);

    } else {
      // --- Text-Pfad (wie bisher) ---
      const body = await request.json();
      const text = body?.text;
      if (!text || typeof text !== "string" || !text.trim()) {
        return new Response(
          JSON.stringify({ error: "Missing text" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      rawText = text;
    }
  } catch (e) {
    const details = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({ error: "Could not read input", details }),
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


/**------------------------------------------------------------------------------ 
 * --- INTERNAL HELPER FUNCTIONS ---
 * ------------------------------------------------------------------------------*/

/**
 * Stellt sicher, dass die Datei einen gültigen Namen hat.
 * Wenn nicht, wird eine neue Datei mit einer Standard-Endung erstellt.
 * @param file Die ursprüngliche Datei.
 * @returns Eine Datei mit gültigem Namen.
 */
function ensureFileName(file: File): File {
  const hasExtension = file.name && file.name.includes(".");
  if (hasExtension) {
    return file; // Name passt schon, nichts zu tun.
  }
  // Kein/komischer Name -> neu verpacken mit Standard-Endung.
  // webm ist das, was Browser-MediaRecorder meist liefert.
  return new File([file], "audio.webm", { type: file.type || "audio/webm" });
}