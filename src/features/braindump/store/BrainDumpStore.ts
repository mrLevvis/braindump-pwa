import { create } from "zustand";
import type { BrainDumpState, DeleteResult, EntryDraft, IngestPreview, InsertEntry, ToggleResult } from "../types";
import { deleteEntry as deleteEntryFromApi, fetchEntries, insertEntries, toggleTaskCompleted as toggleApi } from "../services";
import { processText } from "../services/processBrainDump";
import { prioritizeDayTasks as prioritizeApi } from "../services/prioritizeTasks";
import { showErrorToast } from "../../../hooks/useErrorToast";

/**
 * Globaler Zustand-Store für das BrainDump-Feature.
 * Hält Einträge + Statusflags.
 */
export const useBrainDumpStore = create<BrainDumpState>()((set) => ({
    // --- INITIAL STATE ---
    entries: [],
    isRecording: false,
    isProcessing: false,
    isPrioritizing: false,
    pendingPreview: null,
    prioritizedDays: {},

    // --- ACTIONS (MUTATIONS) ---
    setRecording: (status: boolean) => {
        set(() => ({ isRecording: status }));
    },

    setProcessing: (status: boolean) => {
        set(() => ({ isProcessing: status }));
    },

    updateEntryList: () => {
        fetchEntries().then((data) => {
            if (data) set(() => ({ entries: data }));
        });
    },

    submitText: async (text: string) => {
        set(() => ({ isProcessing: true }));
        try {
            // 1. Text von der KI strukturieren lassen — liefert captureId + entries[].
            const { captureId, entries } = await processText(text);

            // 2. Drafts für die Preview zusammenbauen — kein DB-Insert hier.
            const drafts: EntryDraft[] = entries.map((e) => ({
                title: e.title,
                original_text: text,
                category: e.category,
                payload: e.payload,
                captureId,
                sourceExcerpt: e.sourceExcerpt,
                summary: e.summary,
                completed: false,
            }));

            set(() => ({ pendingPreview: { captureId, drafts } }));
        } catch (e) {
            throw e;
        } finally {
            set(() => ({ isProcessing: false }));
        }
    },

    confirmIngest: async (preview: IngestPreview) => {
        const newEntries: InsertEntry[] = preview.drafts.map((d) => ({
            title: d.title,
            original_text: d.original_text,
            category: d.category,
            payload: d.payload,
            capture_id: d.captureId,
            source_excerpt: d.sourceExcerpt,
            summary: d.summary,
            completed: d.category === 'TASK' ? false : null,
        }));

        await insertEntries(newEntries);
        const data = await fetchEntries();
        if (data) set(() => ({ entries: data }));
        set(() => ({ pendingPreview: null }));
    },

    discardIngest: (_captureId: string) => {
        set(() => ({ pendingPreview: null }));
    },

    deleteEntry: async (id: string): Promise<DeleteResult> => {
        const result = await deleteEntryFromApi(id);

        if (result.status === 'deleted') {
            const data = await fetchEntries();
            if (data) set(() => ({ entries: data }));
        }

        return result;
    },

    prioritizeDayTasks: async (date, tasks) => {
        set(() => ({ isPrioritizing: true }));
        try {
            const result = await prioritizeApi(tasks);
            set(s => ({ prioritizedDays: { ...s.prioritizedDays, [date]: result.orderedTaskIds } }));
        } catch (e) {
            showErrorToast(`Priorisierung fehlgeschlagen: ${(e as Error).message}`);
        } finally {
            set(() => ({ isPrioritizing: false }));
        }
    },

    toggleTaskCompleted: async (id: string, completed: boolean): Promise<ToggleResult> => {
        // Optimistic update — flip the flag immediately for instant UI feedback.
        set(s => ({
            entries: s.entries.map(e => e.id === id ? { ...e, completed } : e),
        }));

        const result = await toggleApi(id, completed);

        if (result.status !== 'toggled') {
            // Revert on any failure to keep UI consistent with DB state.
            set(s => ({
                entries: s.entries.map(e => e.id === id ? { ...e, completed: !completed } : e),
            }));
            if (result.status === 'error') showErrorToast(result.message);
        }

        return result;
    },
}));