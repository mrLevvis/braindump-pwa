/**
 * supabase/functions/reprocess-entry/index.ts
 * Führt denselben KI-Verarbeitungspfad wie process-brain-dump für einen einzelnen,
 * bereits existierenden Entry aus — ausgelöst durch nachträgliche Bearbeitungen.
 *
 * Unterschiede zu process-brain-dump:
 *  • Eingabe ist gezielter Text (Titel + Summary), nicht ein freier Dump-Text.
 *  • Es wird immer genau ein Entry erwartet und zurückgegeben (kein captureId-Batch).
 *  • SHOPPING-Items werden nicht neu eingefügt, sondern atomisch ersetzt
 *    (DELETE alte Items → INSERT neue Items unter demselben captureId).
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
import { ENTRY_CATEGORIES, SHOPPING_CATEGORIES, SHOPPING_UNITS, normalizeEntryContract } from "../_shared/contract.ts";
import type { ShoppingCategory, ShoppingUnit } from "../_shared/contract.ts";
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

  // 7. SHOPPING-Items atomar ersetzen, falls ein captureId vorliegt.
  //    Reihenfolge: Preis-Historie abfragen → DELETE → INSERT.
  //    Historie wird VOR dem DELETE gelesen, damit die aktuellen Preise als
  //    Datenpunkte einfließen (nach dem Löschen wären sie weg).
  //    user_id muss explizit gesetzt werden, weil auth.uid() im Service-Role-Kontext NULL ist.
  if (entry.category === "SHOPPING" && captureId) {
    const userId = getUserIdFromJWT(request);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: no user session for shopping update" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // KI kann Strings (altes Format) oder Objekte (neues Format) liefern — beide fangen.
    const itemsFlat = (entry.payload.items ?? []).map((raw) => {
      const isObj = raw !== null && typeof raw === "object";
      const label: string = isObj ? (raw as { label: string }).label : String(raw);
      const aiPrice: number | null = isObj ? ((raw as { estimatedPrice?: number }).estimatedPrice ?? null) : null;
      const rawCategory = isObj ? (raw as { category?: string }).category : undefined;
      const category: ShoppingCategory = (SHOPPING_CATEGORIES as readonly string[]).includes(rawCategory ?? '') ? rawCategory as ShoppingCategory : 'SONSTIGES';
      const rawUnit = isObj ? (raw as { unit?: string }).unit : undefined;
      const validUnit = (SHOPPING_UNITS as readonly string[]).includes(rawUnit ?? '');
      const unit: ShoppingUnit = validUnit ? rawUnit as ShoppingUnit : 'STUECK';
      const rawCount = isObj ? (raw as { count?: unknown }).count : undefined;
      const count: number = typeof rawCount === 'number' && rawCount >= 1 ? Math.round(rawCount) : 1;
      const rawAmount = isObj ? (raw as { amount?: unknown }).amount : undefined;
      // Invariante: amount ist null genau dann wenn unit = STUECK
      const amount: number | null = unit !== 'STUECK' && typeof rawAmount === 'number' && rawAmount > 0 ? rawAmount : null;
      return { label, aiPrice, category, count, amount, unit };
    });

    // Preis-Historien VOR dem Löschen abrufen — aktuelle Einträge zählen als Datenpunkte.
    const priceHistories = await Promise.all(
      itemsFlat.map(({ label }) => fetchPriceHistory(supabase, userId, label))
    );

    const { error: deleteError } = await supabase
      .from("shopping_items")
      .delete()
      .eq("source_dump", captureId);

    if (deleteError) {
      return new Response(
        JSON.stringify({ error: "Failed to delete old shopping items", details: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rows = itemsFlat.map(({ label, aiPrice, category, count, amount, unit }, i) => ({
      label,
      category,
      estimated_price: resolveItemPrice(priceHistories[i], aiPrice),
      count,
      amount,
      unit,
      is_done: false,
      source_dump: captureId,
      user_id: userId,
    }));

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from("shopping_items").insert(rows);
      if (insertError) {
        return new Response(
          JSON.stringify({ error: "Failed to insert new shopping items", details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
  }

  // Item-Labels 1:1 als Tags in den Entry-Payload schreiben — kein KI-Ermessen.
  if (entry.category === "SHOPPING") {
    entry.payload.tags = (entry.payload.items ?? []).map((raw) => {
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
