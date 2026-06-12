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
 * Ein React-Hook, der die Funktion zum Einreichen von Text aus dem BrainDump-Store abruft.
 * @returns Eine Funktion zum Einreichen von Text.
 */
export function useSubmitText() {
    return useBrainDumpStore((s) => s.submitText);
}

/**
 * Ein React-Hook, der die Loesch-Funktion fuer Eintraege aus dem BrainDump-Store abruft.
 * @returns Eine Funktion zum Loeschen eines Eintrags per ID.
 */
export function useDeleteEntry() {
    return useBrainDumpStore((s) => s.deleteEntry);
}

export function useDeleteEntries() {
    return useBrainDumpStore((s) => s.deleteEntries);
}

/**
 * Ein React-Hook, der die Toggle-Funktion fuer den completed-Status abruft.
 * @returns Eine Funktion zum Toggeln des completed-Status eines Tasks.
 */
export function useToggleTaskCompleted() {
    return useBrainDumpStore((s) => s.toggleTaskCompleted);
}

export function useUpdateEntry() {
    return useBrainDumpStore((s) => s.updateEntry);
}

/**
 * Ein React-Hook, der die Funktion zum Setzen des Verarbeitungs-Status abruft.
 * @returns Eine Funktion zum Setzen von isProcessing.
 */
export function useSetProcessing() {
    return useBrainDumpStore((s) => s.setProcessing);
}

export function usePendingPreview() {
    return useBrainDumpStore((s) => s.pendingPreview);
}

export function useConfirmIngest() {
    return useBrainDumpStore((s) => s.confirmIngest);
}

export function useDiscardIngest() {
    return useBrainDumpStore((s) => s.discardIngest);
}

export function useIsPrioritizing() {
    return useBrainDumpStore((s) => s.isPrioritizing);
}

export function usePrioritizedDays() {
    return useBrainDumpStore((s) => s.prioritizedDays);
}

export function usePrioritizeDayTasks() {
    return useBrainDumpStore((s) => s.prioritizeDayTasks);
}
