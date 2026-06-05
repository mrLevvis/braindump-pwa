import { create } from "zustand";
import type { BrainDumpState, DeleteResult, InsertEntry, ToggleResult } from "../types";
import { deleteEntry as deleteEntryFromApi, fetchEntries, insertEntry, toggleTaskCompleted as toggleApi } from "../services";
import { processText } from "../services/processBrainDump";

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
            // 1. Text von der KI strukturieren lassen.
            const structured = await processText(text);

            // 2. Den Eintrag für die DB zusammenbauen (id/created_at macht Supabase).
            const newEntry: InsertEntry = {
                title: structured.title,
                original_text: text,
                category: structured.category,
                payload: structured.payload,
            };

            // 3. Speichern, dann Liste neu laden, damit der Eintrag erscheint.
            await insertEntry(newEntry);
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
        }

        return result;
    },
}));