/**
 * supabase/functions/reprocess-entry/index.ts
 * Führt denselben KI-Verarbeitungspfad wie process-brain-dump für einen einzelnen,
 * bereits existierenden Entry aus — ausgelöst durch nachträgliche Bearbeitungen.
 *
 * Unterschiede zu process-brain-dump:
 *  • Eingabe ist gezielter Text (Titel + Summary), nicht ein freier Dump-Text.
 *  • Es wird immer genau ein Entry erwartet und zurückgegeben (kein captureId-Batch).
 *  • SHOPPING-Items werden nicht in der EdgeFn geschrieben — Items werden in
 *    payload.items angereichert zurückgegeben; der Store übernimmt DELETE + INSERT.
 *  • Kein captureId wird serverseitig vergeben — der bestehende captureId des
 *    Entries wird vom Client mitgeliefert.
 *
 * Gemeinsam genutzte Module:
 *  • ../process-brain-dump/structureText.ts  — Groq-Aufruf + JSON-Parsing
 *  • ../_shared/contract.ts                  — Typen, Validierung, Normalisierung
 */

import "@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "@supabase/supabase-js";
import { getCorsHeaders } from "../_shared/cors.ts";
import { structureText } from "../process-brain-dump/structureText.ts";
import type { StructuredEntry } from "../_shared/contract.ts";
import { ENTRY_CATEGORIES, normalizeEntryContract } from "../_shared/contract.ts";
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
    Array.isArray(entry.summary) && (entry.summary as unknown[]).length >= 1 &&
    (entry.summary as unknown[]).every((s) => typeof s === "string")
  );
}

Deno.serve(async (request) => {
  const corsHeaders = getCorsHeaders(request);

  // 1. CORS-Preflight beantworten — Browser schickt OPTIONS vor dem echten Request.
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

  // 3. Request-Body auslesen: text (Pflicht) + captureId (optional, nur für SHOPPING).
  let text: string;
  let captureId: string | undefined;

  try {
    const body = await request.json();
    if (!body?.text || typeof body.text !== "string" || !body.text.trim()) {
      return new Response(
        JSON.stringify({ error: "Missing text" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    text = body.text;
    captureId = typeof body.captureId === "string" ? body.captureId : undefined;
  } catch (e) {
    const details = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({ error: "Could not read input", details }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 4. Den Text von Groq strukturieren lassen (gemeinsames Modul mit process-brain-dump).
  let ingestResponse: { entries: unknown[] };
  try {
    ingestResponse = await structureText(text, groqApiKey);
  } catch (e) {
    const details = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({ error: "AI request failed", details }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 5. Vertrag prüfen — wir erwarten mindestens einen Entry; nur der erste zählt.
  if (!Array.isArray(ingestResponse?.entries) || ingestResponse.entries.length === 0) {
    return new Response(
      JSON.stringify({ error: "Invalid AI response: missing entries array", raw: ingestResponse }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const rawEntry = ingestResponse.entries[0];
  if (!isValidEntry(rawEntry)) {
    return new Response(
      JSON.stringify({ error: "Invalid AI response: malformed entry", entry: rawEntry }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 6. Zeitbezug-Vertrag normalisieren (identisch zu process-brain-dump Schritt 6).
  const entry = normalizeEntryContract(rawEntry as StructuredEntry);

  // 7. SHOPPING-Items anreichern: Preis-Historien abrufen, estimatedPrice auflösen.
  //    Kein DB-Write — Items reisen in payload.items zurück zum Client.
  //    Der aufrufende Store (reprocessEntry) übernimmt DELETE + INSERT nach dem Update.
  //    user_id muss explizit aus dem JWT geholt werden — im Service-Role-Kontext ist
  //    auth.uid() immer NULL und würde fetchPriceHistory (user-gefiltert) leer liefern.
  if (entry.category === "SHOPPING") {
    const rawItems = entry.payload.items ?? [];

    if (rawItems.length > 0) {
      const userId = getUserIdFromJWT(request);
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: no user session for shopping enrichment" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Preis-Historien parallel abrufen — aktuelle DB-Preise fließen als Datenpunkte ein.
      const priceHistories = await Promise.all(
        rawItems.map((raw) => {
          const isObj = raw !== null && typeof raw === "object";
          const label = isObj ? (raw as { label: string }).label : String(raw);
          return fetchPriceHistory(supabase, userId, label);
        })
      );

      // Angereicherte Items mit aufgelöstem estimatedPrice zurückschreiben.
      entry.payload.items = rawItems.map((raw, i) => {
        const isObj = raw !== null && typeof raw === "object";
        const label: string = isObj ? (raw as { label: string }).label : String(raw);
        const aiPrice: number | null = isObj ? ((raw as { estimatedPrice?: number }).estimatedPrice ?? null) : null;
        const resolved = resolveItemPrice(priceHistories[i], aiPrice);
        if (isObj) {
          return { ...(raw as Record<string, unknown>), estimatedPrice: resolved ?? undefined };
        }
        return { label, estimatedPrice: resolved ?? undefined };
      });
    }

    // Nur Top-Level-Items als Tags — Sub-Items (parentLabel gesetzt) bleiben taglos.
    entry.payload.tags = (entry.payload.items ?? [])
      .filter((raw) => {
        const isObj = raw !== null && typeof raw === "object";
        return isObj ? !(raw as { parentLabel?: string }).parentLabel : true;
      })
      .map((raw) => {
        const isObj = raw !== null && typeof raw === "object";
        return isObj ? (raw as { label: string }).label : String(raw);
      });
  }

  // 8. Den neu strukturierten Entry zurückgeben — der Client übernimmt das DB-Update.
  return new Response(JSON.stringify({ entry }), {
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
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const base64Payload = auth.slice(7).split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const payload = JSON.parse(atob(base64Payload));
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
