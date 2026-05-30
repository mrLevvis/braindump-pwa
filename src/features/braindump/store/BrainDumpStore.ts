import { create } from "zustand";
import type { BrainDumpState, BrainDumpEntry } from "../types";

import { fetchEntries, insertEntry } from "../services";
import { createRecordingSlice } from "./recordingSliceStore";

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
    // --- AUDIO RECORDING SLICE ---
    ...createRecordingSlice(...a),
}));

// Initiales Laden der Einträge (außerhalb des Factory-Objekts, damit es nur einmal passiert)
useBrainDumpStore.getState().updateEntryList();