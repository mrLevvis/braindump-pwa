import { create } from "zustand";
import type { BrainDumpState, BrainDumpEntry, InsertEntry } from "../types";
import { fetchEntries, insertEntry } from "../services";
import { createRecordingSlice } from "./recordingSliceStore";
import { processText } from "../services/processBrainDump";

/**
 * Erstellt den Zustandsslice für den BrainDump, einschließlich der Einträge und der Funktionen zum Aktualisieren dieser Einträge.
 * Dieser Slice wird in unserem Zustand-Management (z.B. Zustand) verwendet, um die BrainDump-Funktionalität zu kapseln.
 * @param set Die Funktion zum Aktualisieren des Zustands.
 * @returns Ein Objekt, das den Zustandsslice für den BrainDump enthält.
 */

export const useBrainDumpStore = create<BrainDumpState>()((...a) => ({
    // --- INITIAL STATE ---
    entries: [],
    isRecording: false,
    isProcessing: false,

    // --- ACTIONS (MUTATIONS) ---
    setRecording: (status: boolean) => {
        a[0](() => ({ isRecording: status }));
    },

    setProcessing: (status: boolean) => {
        a[0](() => ({ isProcessing: status }));
    },

    addDummyEntry: (text: string) => {
        const newEntry: BrainDumpEntry = {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            title: undefined,
            original_text: text,
            category: 'NOTE',
            payload: {},
        };
        insertEntry(newEntry);
    },

    updateEntryList: () => {
        fetchEntries().then((data) => {
            if (data) a[0](() => ({ entries: data }));
        });
    },

    submitText: async (text: string) => {
        a[0](() => ({ isProcessing: true }));
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
            if (data) a[0](() => ({ entries: data }));
        } catch (e) {
            console.error('submitText failed:', e);
            // TODO später: Fehler im State halten und dem Nutzer zeigen
        } finally {
            a[0](() => ({ isProcessing: false }));
        }
    },

    // --- AUDIO RECORDING SLICE ---
    ...createRecordingSlice(...a),
}));

// Initiales Laden der Einträge (außerhalb des Factory-Objekts, damit es nur einmal passiert)
useBrainDumpStore.getState().updateEntryList();