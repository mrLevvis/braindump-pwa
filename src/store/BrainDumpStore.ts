import { create } from "zustand";
import type { BrainDumpState } from "../features/braindump/types/BrainDump";
import { DASHBOARD_MOCK_ENTRIES } from "../features/braindump/mock-entries/dashboard-mock-entries";


// Initialisierung des Stores
export const useBrainDumpStore = create<BrainDumpState>((set) => ({
    // --- INITIAL STATE ---
    entries: DASHBOARD_MOCK_ENTRIES,

    isRecording: false,
    isProcessing: false,

    // --- ACTIONS ---
    setRecording: (status) => {
        // TODO: Zustand-State aktualisieren
    },

    setProcessing: (status) => {
        // TODO: Zustand-State aktualisieren
    },

    addDummyEntry: (text) => {
        // TODO: Erstelle ein neues BrainDumpEntry-Objekt (mit einer zufälligen ID, z.B. crypto.randomUUID(), 
        // dem aktuellen Zeitstempel, der Kategorie 'NOTE' und leerem payload).
        // TODO: Füge dieses neue Objekt dem bestehenden entries-Array im State hinzu.
    }
}));