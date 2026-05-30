import { useState, useCallback } from 'react';
import { useMediaRecorder } from './';


/**------------------------------------------------------------------------------ 
 * --- HOOK: useVoiceRecording ---
 * ------------------------------------------------------------------------------*/

/**
 * Ein React-Hook, der die Funktionalität zum Aufnehmen von Audio über die MediaRecorder API bereitstellt.
 * Er kapselt die gesamte Logik für die Audioaufnahme, einschließlich der Verwaltung von Status, Fehlern und der Erstellung von Blobs.
 * @param onRecordingComplete Callback, der aufgerufen wird, wenn die Aufnahme abgeschlossen ist.
 * @param onError Callback, der aufgerufen wird, wenn ein Fehler auftritt.
 * @returns Ein Objekt mit Funktionen zum Starten/Stoppen der Aufnahme und Statusinformationen.
 */
export function useVoiceRecording(onRecordingComplete?: (blob: Blob) => void, onError?: (err: Error) => void) {

    /** State für Fehler, die während der Aufnahme auftreten können */
    const [error, setError] = useState<Error | null>(null);

    /** MediaRecorder-Instanz und zugehörige Funktionen */
    const recorder = useMediaRecorder({
        onRecordingComplete: onRecordingComplete ?? (() => { }),
        onError: (err) => {
            setError(err instanceof Error ? err : new Error(String(err)));
            if (onError) onError(err instanceof Error ? err : new Error(String(err)));
        },
    });

    /** Funktion zum Umschalten der Aufnahme (Start/Stop) */
    const toggleRecording = useCallback(() => {
        if (recorder.status === 'requesting') return;
        if (recorder.status === 'recording') {
            recorder.stopRecording();
        } else {
            recorder.startRecording();
        }
    }, [recorder]);

    /** Gibt die Recorder-Funktionen und den Fehlerstatus zurück */
    return {
        ...recorder,
        error,
        toggleRecording,
    };
}


/**------------------------------------------------------------------------------ 
 * --- INTERNAL HELPER FUNCTIONS ---
 * ------------------------------------------------------------------------------*/

