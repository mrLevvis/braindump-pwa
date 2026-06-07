import { create } from "zustand";
import type { BrainDumpState, DeleteResult, InsertEntry, ToggleResult } from "../types";
import { deleteEntry as deleteEntryFromApi, fetchEntries, insertEntries, toggleTaskCompleted as toggleApi } from "../services";
import { processText } from "../services/processBrainDump";
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

            // 2. Alle Entries für den Batch-Insert zusammenbauen.
            //    Jede Zeile trägt denselben captureId + vollen original_text + eigenen source_excerpt.
            const newEntries: InsertEntry[] = entries.map((e) => ({
                title: e.title,
                original_text: text,
                category: e.category,
                payload: e.payload,
                capture_id: captureId,
                source_excerpt: e.sourceExcerpt,
                summary: e.summary,
            }));

            // 3. Batch-Insert, dann Liste neu laden.
            await insertEntries(newEntries);
            const data = await fetchEntries();
            if (data) set(() => ({ entries: data }));
        } catch (e) {
            throw e;
        } finally {
            set(() => ({ isProcessing: false }));
        }
    },

    deleteEntry: async (id: string): Promise<DeleteResult> => {
        const result = await deleteEntryFromApi(id);

        if (result.status === 'deleted') {
            const data = await fetchEntries();
            if (data) set(() => ({ entries: data }));
        }

        return result;
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