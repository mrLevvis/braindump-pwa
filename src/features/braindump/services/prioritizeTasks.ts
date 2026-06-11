import type { BrainDumpEntry, PriorityResult } from '../types';

const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function resolvePrioritizeUrl(): string {
    const direct = import.meta.env.VITE_PRIORITIZE_FUNCTION_URL?.trim();
    if (direct) return direct;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
    if (!supabaseUrl) throw new Error('Missing VITE_SUPABASE_URL');
    return `${supabaseUrl}/functions/v1/prioritize-tasks`;
}

const FUNCTION_URL = resolvePrioritizeUrl();

/**
 * Schickt die TASK-Entries des Tages an die Edge Function und gibt die priorisierte
 * ID-Reihenfolge zurück. Nur TASK-Entries werden übergeben; andere Kategorien ignoriert.
 */
export async function prioritizeDayTasks(tasks: readonly BrainDumpEntry[]): Promise<PriorityResult> {
    if (!ANON_KEY) throw new Error('Missing VITE_SUPABASE_ANON_KEY');

    const payload = tasks
        .filter(e => e.category === 'TASK')
        .map(e => ({ id: e.id, title: e.title ?? e.original_text, summary: e.summary ?? [] }));

    if (payload.length === 0) return { orderedTaskIds: [] };

    const response = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
            apikey: ANON_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tasks: payload }),
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Prioritize request failed: ${response.status}`);
    }

    return response.json();
}
