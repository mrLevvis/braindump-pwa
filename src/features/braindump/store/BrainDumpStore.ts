import { create } from "zustand";
import type { BrainDumpState, BrainDumpEntry } from "../types";
import { fetchEntries, insertEntry } from "../services/ApiClient";

// Initialisierung des Stores
export const useBrainDumpStore = create<BrainDumpState>((set) => {
    // --- INITIAL STATE ---
    const initialState = {
        entries: [], // Startet leer, wird asynchron geladen
        isRecording: false,
        isProcessing: false,
    };

    // --- ACTIONS ---
    const setRecording = (status: boolean) => {
        set(() => ({ isRecording: status }));
    };

    const setProcessing = (status: boolean) => {
        set(() => ({ isProcessing: status }));
    };

    const addDummyEntry = (text: string) => {
        const newEntry: BrainDumpEntry = {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            title: undefined,
            original_text: text,
            category: 'NOTE',
            payload: {},
        };
        // set((state) => ({ entries: [newEntry, ...state.entries] }));
        insertEntry(newEntry);
    };

    const updateEntryList = () => {
        fetchEntries().then((data) => {
            if (data) set(() => ({ entries: data }));
        });
    };

    // Einträge asynchron laden, sobald der Store initialisiert wird
    updateEntryList();

    return {
        ...initialState,
        setRecording,
        setProcessing,
        addDummyEntry,
        updateEntryList,
    };
});