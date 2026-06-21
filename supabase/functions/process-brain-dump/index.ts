/**
 * supabase/functions/process-brain-dump/index.ts
 * Einstiegspunkt für neue Dumps: nimmt den Request an, entscheidet Audio vs. Text
 * und gibt den validierten Vertrag zurück. Orchestriert nur, enthält keine Logik.
 *
 * Geschwister-Function für nachträgliche Bearbeitungen: ../reprocess-entry/index.ts
 * Gemeinsam genutzte Module:
 *  • ./structureText.ts     — Groq-Aufruf + JSON-Parsing (auch von reprocess-entry genutzt)
 *  • ../_shared/contract.ts — Typen, Validierung, Normalisierung
 */

import "@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "@supabase/supabase-js";
import { getCorsHeaders } from "../_shared/cors.ts";
import { structureText } from "./structureText.ts";
import type { ContextEntry, EntryAdditionalInfo, StructuredEntry } from "../_shared/contract.ts";
import { ENTRY_CATEGORIES, normalizeEntryContract } from "../_shared/contract.ts";
import { transcribeAudio } from "./transcribeAudio.ts";
import { fetchPriceHistory, resolveItemPrice } from "../_shared/priceHistory.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

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

function isValidAdditionalInfo(a: unknown): a is EntryAdditionalInfo {
  if (!a || typeof a !== "object" || Array.isArray(a)) return false;
  const info = a as Record<string, unknown>;
  return (
    typeof info.targetEntryId === "string" && info.targetEntryId.trim().length > 0 &&
    typeof info.content === "string" && info.content.trim().length > 0
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
  let contextEntries: ContextEntry[] | undefined;

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
      // contextEntries ist optional: bestehende Einträge als Kontext für die KI.
      if (Array.isArray(body?.contextEntries)) {
        contextEntries = (body.contextEntries as unknown[]).filter(
          (e): e is ContextEntry =>
            !!e && typeof e === "object" && !Array.isArray(e) &&
            typeof (e as Record<string, unknown>).id === "string" &&
            typeof (e as Record<string, unknown>).title === "string" &&
            typeof (e as Record<string, unknown>).category === "string"
        );
      }
    }
  } catch (e) {
    const details = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({ error: "Could not read input", details }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }


  // 4. Den Rohtext von Groq strukturieren lassen.
  let ingestResponse: { entries: unknown[]; additionalInfos?: unknown[] };
  try {
    ingestResponse = await structureText(rawText, groqApiKey, contextEntries);
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

  // 8. SHOPPING-Items direkt in shopping_items schreiben (als sofort verfügbare Einkaufsliste).
  //    user_id muss explizit aus dem JWT geholt werden — im Service-Role-Kontext ist
  //    auth.uid() immer NULL und würde den NOT NULL-Constraint auf user_id verletzen.
  const shoppingEntries = normalizedEntries.filter(e => e.category === 'SHOPPING');

  if (shoppingEntries.length > 0) {
    const userId = getUserIdFromJWT(request);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: no user session for shopping insert" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // AI kann Strings (altes Format) oder Objekte (neues Format) liefern – beide fangen.
    const itemsFlat = shoppingEntries.flatMap(e =>
      (e.payload.items ?? []).map((raw) => {
        const isObj = raw !== null && typeof raw === 'object';
        const label: string = isObj ? (raw as { label: string }).label : String(raw);
        const aiPrice: number | null = isObj ? ((raw as { estimatedPrice?: number }).estimatedPrice ?? null) : null;
        return { label, aiPrice };
      })
    );

    // Preis-Historien parallel abrufen; neuere Käufe fließen stärker gewichtet ein.
    const priceHistories = await Promise.all(
      itemsFlat.map(({ label }) => fetchPriceHistory(supabase, userId, label))
    );

    const rows = itemsFlat.map(({ label, aiPrice }, i) => ({
      label,
      estimated_price: resolveItemPrice(priceHistories[i], aiPrice),
      is_done: false,
      source_dump: captureId,
      user_id: userId,
    }));

    if (rows.length > 0) {
      const { error: dbError } = await supabase.from('shopping_items').insert(rows);
      if (dbError) {
        return new Response(
          JSON.stringify({ error: "Failed to insert shopping items", details: dbError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
  }

  // Item-Labels 1:1 als Tags in den Entry-Payload schreiben — kein KI-Ermessen.
  for (const e of shoppingEntries) {
    e.payload.tags = (e.payload.items ?? []).map((raw) => {
      const isObj = raw !== null && typeof raw === 'object';
      return isObj ? (raw as { label: string }).label : String(raw);
    });
  }

  // 9. additionalInfos validieren — ungültige Einträge stillschweigend verwerfen.
  const additionalInfos: EntryAdditionalInfo[] = Array.isArray(ingestResponse.additionalInfos)
    ? (ingestResponse.additionalInfos as unknown[]).filter(isValidAdditionalInfo)
    : [];

  // 10. Alle Entries + additionalInfos zurückgeben — SHOPPING-Entries erscheinen als EntryCard im Dashboard.
  const responsePayload: Record<string, unknown> = { captureId, entries: normalizedEntries };
  if (additionalInfos.length > 0) responsePayload.additionalInfos = additionalInfos;
  return new Response(JSON.stringify(responsePayload), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});


/**------------------------------------------------------------------------------ 
 * --- INTERNAL HELPER FUNCTIONS ---
 * ------------------------------------------------------------------------------*/

/**
 * Extrahiert die user_id (sub-Claim) aus dem Supabase-JWT im Authorization-Header.
 * Nötig, weil der Service-Role-Client kein auth.uid() liefert und wir user_id
 * beim Insert in user-isolierte Tabellen explizit setzen müssen.
 * JWT nutzt base64url (- und _), atob() erwartet standard base64 (+ und /).
 */
function getUserIdFromJWT(request: Request): string | null {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const base64Payload = auth.slice(7).split('.')[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const payload = JSON.parse(atob(base64Payload));
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

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