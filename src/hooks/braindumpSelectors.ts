import { useBrainDumpStore } from '../features/braindump/store';


/**------------------------------------------------------------------------------ 
 * --- BRAINDUMP SELECTORS ---
 * ------------------------------------------------------------------------------*/

/**
 * Ein React-Hook, der den Aufnahme-Status aus dem BrainDump-Store abruft.
 * @returns Ein boolean, der angibt, ob gerade aufgenommen wird.
 */
export function useIsRecording() {
    return useBrainDumpStore((s) => s.isRecording);
}

/**
 * Ein React-Hook, der den Verarbeitungs-Status aus dem BrainDump-Store abruft.
 * @returns Ein boolean, der angibt, ob gerade verarbeitet wird.
 */
export function useIsProcessing() {
    return useBrainDumpStore((s) => s.isProcessing);
}

/**
 * Ein React-Hook, der die Einträge aus dem BrainDump-Store abruft.
 * @returns Ein Array von Einträgen.
 */
export function useEntries() {
    return useBrainDumpStore((s) => s.entries);
}

/**
 * Ein React-Hook, der die Funktion zum Setzen des Aufnahme-Status aus dem BrainDump-Store abruft.
 * @returns Eine Funktion zum Setzen des Aufnahme-Status.
 */
export function useSetRecording() {
    return useBrainDumpStore((s) => s.setRecording);
}

/**
 * Ein React-Hook, der die Funktion zum Hinzufügen eines Dummy-Eintrags aus dem BrainDump-Store abruft.
 * @returns Eine Funktion zum Hinzufügen eines Dummy-Eintrags.
 */
export function useAddDummyEntry() {
    return useBrainDumpStore((s) => s.addDummyEntry);
}

/**
 * Ein React-Hook, der die Funktion zum Aktualisieren der Eintragsliste aus dem BrainDump-Store abruft.
 * @returns Eine Funktion zum Aktualisieren der Eintragsliste.
 */
export function useUpdateEntryList() {
    return useBrainDumpStore((s) => s.updateEntryList);
}
