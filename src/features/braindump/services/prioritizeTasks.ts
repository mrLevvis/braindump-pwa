import type { BrainDumpEntry, PriorityResult } from '../types';
import { supabase } from './ApiClient';

export async function prioritizeDayTasks(tasks: readonly BrainDumpEntry[]): Promise<PriorityResult> {
    const payload = tasks
        .filter(e => e.category === 'TASK')
        .map(e => ({ id: e.id, title: e.title ?? e.original_text, summary: e.summary ?? [] }));

    if (payload.length === 0) return { orderedTaskIds: [] };

    const { data, error } = await supabase.functions.invoke<PriorityResult>('prioritize-tasks', {
        body: { tasks: payload },
    });
    if (error) throw new Error(error.message);
    return data!;
}
