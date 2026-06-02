import { create } from "zustand";
import type { BrainDumpState, InsertEntry } from "../types";
import { deleteEntry as deleteEntryFromApi, fetchEntries, insertEntry } from "../services";
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

    deleteEntry: async (id: string) => {
        const deleted = await deleteEntryFromApi(id);
        if (!deleted) throw new Error('Deleting entry failed.');

        const data = await fetchEntries();
        if (!data) throw new Error('Refreshing entries after delete failed.');

        set(() => ({ entries: data }));
    },
}));

// Initiales Laden der Einträge (außerhalb des Factory-Objekts, damit es nur einmal passiert)
useBrainDumpStore.getState().updateEntryList();