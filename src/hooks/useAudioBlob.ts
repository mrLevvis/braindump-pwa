import { useBrainDumpStore } from '../features/braindump/store';

/**
 * Ein React-Hook, der den aktuellen Audio-Blob und die Setter-Funktion aus dem Recording-Slice abruft.
 */
export function useAudioBlob() {
    return useBrainDumpStore((s) => s.audioBlob);
}

export function useSetAudioBlob() {
    return useBrainDumpStore((s) => s.setAudioBlob);
}
