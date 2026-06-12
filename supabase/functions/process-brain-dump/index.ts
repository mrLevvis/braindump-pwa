/**
 * supabase/functions/process-brain-dump/index.ts
 * * Einstiegspunkt der Function: nimmt den Request an, entscheidet Audio vs. Text
 * * und gibt den validierten Vertrag zurück. Orchestriert nur, enthält keine Logik.
 */

import "@supabase/functions-js/edge-runtime.d.ts";

import { getCorsHeaders } from "../_shared/cors.ts";
import { structureText } from "./structureText.ts";
import type { StructuredEntry } from "../_shared/contract.ts";
import { ENTRY_CATEGORIES, normalizeEntryContract } from "../_shared/contract.ts";
import { transcribeAudio } from "./transcribeAudio.ts";

function isValidEntry(e: unknown): e is StructuredEntry {
  if (!e || typeof e !== "object" || Array.isArray(e)) return false;
  const entry = e as Record<string, unknown>;
  return (
    ENTRY_CATEGORIES.includes(entry.category as StructuredEntry["category"]) &&
    typeof entry.title === "string" && entry.title.trim().length > 0 &&
    typeof entry.payload === "object" && entry.payload !== null && !Array.isArray(entry.payload) &&
    typeof entry.sourceExcerpt === "string" && entry.sourceExcerpt.trim().length > 0 &&
    Array.isArray(entry.summary) && (entry.summary as unknown[]).length >= 1 && (entry.summary as unknown[]).every((s) => typeof s === "string")
  );
}


Deno.serve(async (request) => {
  const corsHeaders = getCorsHeaders(request);

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

      // Audio-Pfad endet HIER: nur transkribieren, NICHT strukturieren.
      // Der Nutzer prüft das Transkript erst im Textfeld, schickt es dann
      // über den Text-Pfad (application/json) erneut zur Strukturierung.
      const transcript = await transcribeAudio(safeAudioFile, groqApiKey);
      return new Response(
        JSON.stringify({ text: transcript }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

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
  let ingestResponse: { entries: unknown[] };
  try {
    ingestResponse = await structureText(rawText, groqApiKey);
  } catch (e) {
    const details = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({ error: "AI request failed", details }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 5. Vertrag prüfen — pro Entry in einer Schleife (All-or-Nothing).
  if (!Array.isArray(ingestResponse?.entries) || ingestResponse.entries.length === 0) {
    return new Response(
      JSON.stringify({ error: "Invalid AI response: missing entries array", raw: ingestResponse }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  for (const raw of ingestResponse.entries) {
    if (!isValidEntry(raw)) {
      return new Response(
        JSON.stringify({ error: "Invalid AI response: malformed entry", entry: raw }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // 6. Zeitbezug-Vertrag pro Entry normalisieren.
  const normalizedEntries: StructuredEntry[] = (ingestResponse.entries as StructuredEntry[])
    .map(normalizeEntryContract);

  // 7. captureId serverseitig vergeben — verbindet alle Entries dieses Dumps.
  const captureId = crypto.randomUUID();

  // 8. Alles gut -> { captureId, entries } zurückgeben.
  return new Response(JSON.stringify({ captureId, entries: normalizedEntries }), {
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