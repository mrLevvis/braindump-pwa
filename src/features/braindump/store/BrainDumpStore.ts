import { create } from "zustand";
import type { BrainDumpState, InsertEntry } from "../types";
import { fetchEntries, insertEntry } from "../services";
import { createRecordingSlice } from "./recordingSliceStore";
import { processText } from "../services/processBrainDump";

/**
 * Globaler Zustand-Store für das BrainDump-Feature.
 * Hält Einträge + Statusflags und mischt den Audio-Recording-Slice dazu.
 */
export const useBrainDumpStore = create<BrainDumpState>()((set, get, store) => ({
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
            console.error('submitText failed:', e);
            // TODO später: Fehler im State halten und dem Nutzer zeigen
        } finally {
            set(() => ({ isProcessing: false }));
        }
    },

    // --- AUDIO RECORDING SLICE ---
    ...createRecordingSlice(set, get, store),
}));

// Initiales Laden der Einträge (außerhalb des Factory-Objekts, damit es nur einmal passiert)
useBrainDumpStore.getState().updateEntryList();