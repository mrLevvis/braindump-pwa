import { create } from "zustand";
import type { BrainDumpState } from "../types/BrainDump";
import { DASHBOARD_MOCK_ENTRIES } from "../mock-entries/dashboard-mock-entries";

// Initialisierung des Stores
export const useBrainDumpStore = create<BrainDumpState>((set) => ({
    // --- INITIAL STATE ---
    entries: DASHBOARD_MOCK_ENTRIES,

    isRecording: false,
    isProcessing: false,

    // --- ACTIONS ---

    setRecording: (status) => {
        set(() => ({ isRecording: status }));
    },

    setProcessing: (status) => {
        set(() => ({ isProcessing: status }));
    },

    addDummyEntry: (text) => {
        const newEntry: import("../types/BrainDump").BrainDumpEntry = {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            original_text: text,
            category: 'NOTE', // explizit als EntryCategory
            payload: {},
        };
        set((state) => ({ entries: [newEntry, ...state.entries] }));
    }
}));