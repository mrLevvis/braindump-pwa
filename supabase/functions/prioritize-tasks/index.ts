/**
 * supabase/functions/prioritize-tasks/index.ts
 * Nimmt eine Liste von Tages-Tasks und gibt sie in priorisierter Reihenfolge zurück.
 * Groq-Modell liefert `{ orderedTaskIds: string[] }` via json_object-Format.
 */

import "@supabase/functions-js/edge-runtime.d.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

interface TaskInput {
  id: string;
  title: string;
  summary: string[];
}

const SYSTEM_PROMPT = `You are a personal productivity assistant. Given a list of tasks for today, order them by importance and urgency (most important/urgent first).

Consider:
- Time-sensitive or deadline-driven tasks first
- High-impact work over low-impact work
- Tasks that unblock other work
- Quick wins that reduce mental load

Return ONLY a JSON object with an "orderedTaskIds" array containing the task IDs in priority order.
Example: { "orderedTaskIds": ["id-a", "id-b", "id-c"] }`;

Deno.serve(async (request) => {
  const corsHeaders = getCorsHeaders(request);

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const groqApiKey = Deno.env.get("GROQ_API_KEY");
  if (!groqApiKey) {
    return new Response(
      JSON.stringify({ error: "Missing GROQ_API_KEY" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let tasks: TaskInput[];
  try {
    const body = await request.json();
    if (!Array.isArray(body?.tasks) || body.tasks.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or empty tasks array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    tasks = body.tasks;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const taskList = tasks
    .map((t, i) => `${i + 1}. ID: ${t.id}\n   Title: ${t.title}\n   Notes: ${t.summary.join("; ")}`)
    .join("\n");

  const userMessage = `Here are today's tasks:\n\n${taskList}\n\nReturn them ordered by priority as { "orderedTaskIds": [...] }.`;

  let groqResponse: Response;
  try {
    groqResponse = await fetch(GROQ_CHAT_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
      }),
    });
  } catch (e) {
    const details = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({ error: "Groq request failed", details }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!groqResponse.ok) {
    const text = await groqResponse.text();
    return new Response(
      JSON.stringify({ error: `Groq API error: ${groqResponse.status}`, details: text }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const data = await groqResponse.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content || typeof content !== "string") {
    return new Response(
      JSON.stringify({ error: "Empty response from Groq" }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let parsed: { orderedTaskIds?: unknown };
  try {
    parsed = JSON.parse(content);
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to parse Groq response as JSON", raw: content }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!Array.isArray(parsed?.orderedTaskIds)) {
    return new Response(
      JSON.stringify({ error: "Invalid response shape: missing orderedTaskIds array", raw: parsed }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Keep only IDs that were actually in the input — ignore LLM hallucinations.
  const knownIds = new Set(tasks.map((t) => t.id));
  const orderedTaskIds = (parsed.orderedTaskIds as unknown[])
    .filter((id): id is string => typeof id === "string" && knownIds.has(id));

  return new Response(
    JSON.stringify({ orderedTaskIds }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
