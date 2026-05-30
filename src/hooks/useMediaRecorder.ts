import { useRef, useState, useEffect } from 'react';
import type { UseMediaRecorderOptions, UseMediaRecorderResult, RecorderStatus } from '../features/braindump/types';


/**------------------------------------------------------------------------------ 
 * --- HOOK: useMediaRecorder ---
 * ------------------------------------------------------------------------------*/

/**
 * Ein React-Hook, der die Funktionalität zum Aufnehmen von Audio über die MediaRecorder API bereitstellt.
 * Er kapselt die gesamte Logik für die Audioaufnahme, einschließlich der Verwaltung von Status, Fehlern und der Erstellung von Blobs.
 * @param options Optionen für den MediaRecorder.
 * @returns Ein Objekt mit Funktionen zum Starten/Stoppen der Aufnahme und Statusinformationen.
 */
export function useMediaRecorder(options: UseMediaRecorderOptions): UseMediaRecorderResult {

    /** Refs für MediaRecorder, Audio-Chunks und MediaStream */
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const [status, setStatus] = useState<RecorderStatus>('idle');

    /** Funktion zum Starten der Aufnahme */
    const startRecording = async (): Promise<void> => {
        setStatus('requesting');
        try {
            const stream = await createAudioStream(
                streamRef,
                setStatus,
                options.onError ? (err: unknown) => options.onError?.(err as Error) : undefined
            );
            const recorder = createMediaRecorder(stream, mediaRecorderRef, audioChunksRef, options, setStatus, stopTracks, streamRef);
            recorder.start();
            setStatus('recording');
        } catch {
            // Fehlerbehandlung erfolgt in createAudioStream
        }
    };

    /** Funktion zum Stoppen der Aufnahme */
    const stopRecording = (): void => {
        if (mediaRecorderRef.current && status === 'recording') {
            mediaRecorderRef.current.stop();
            setStatus('idle');
        }
    };

    /** Cleanup-Effekt zum Stoppen der Audio-Tracks beim Unmount */
    useEffect(() => {
        return () => {
            stopTracks(streamRef);
        };
    }, []);

    return {
        status,
        isRecording: status === 'recording',
        startRecording,
        stopRecording,
    };
}

/**------------------------------------------------------------------------------ 
 * --- INTERNAL HELPER FUNCTIONS ---
 * ------------------------------------------------------------------------------*/

/**
 *  Prüft die Unterstützung verschiedener Audio-Mime-Types und gibt den ersten unterstützten zurück.
 *  Dies stellt sicher, dass wir ein kompatibles Format für die Aufnahme verwenden.
 * @returns Der erste unterstützte Audio-Mime-Type oder ein leerer String, wenn keiner unterstützt wird.
 */
function getSupportedMimeType(): string {
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
    if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) return 'audio/ogg;codecs=opus';
    return '';
}

/**
 *  Erstellt einen Audio-Stream über die MediaDevices API.
 *  Setzt den Stream in den übergebenen Ref und behandelt Fehler.
 * @param streamRef Ref, in dem der erstellte MediaStream gespeichert wird.
 * @param setStatus Funktion zum Setzen des Aufnahme-Status.
 * @param onError Optionale Fehlerbehandlungsfunktion.
 * @returns Ein Promise, das den erstellten MediaStream zurückgibt.
 */
import type { RefObject } from 'react';

function createAudioStream(
    streamRef: RefObject<MediaStream | null>,
    setStatus: (s: RecorderStatus) => void,
    onError?: (err: unknown) => void
): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
            streamRef.current = stream;
            return stream;
        })
        .catch((err) => {
            if (onError) onError(err);
            setStatus('idle');
            throw err;
        });
}

/**
 *  Erstellt einen MediaRecorder für den gegebenen Audio-Stream.
 *  Setzt den Recorder in den übergebenen Ref und behandelt Events.
 * @param stream Der MediaStream, der aufgenommen werden soll.
 * @param mediaRecorderRef Ref, in dem der erstellte MediaRecorder gespeichert wird.
 * @param audioChunksRef Ref, in dem die aufgenommenen Audio-Chunks gespeichert werden.
 * @param options Optionen für den MediaRecorder.
 * @param setStatus Funktion zum Setzen des Aufnahme-Status.
 * @param stopTracks Funktion zum Stoppen der Audio-Tracks.
 * @returns Der erstellte MediaRecorder.
 */
function createMediaRecorder(
    stream: MediaStream,
    mediaRecorderRef: RefObject<MediaRecorder | null>,
    audioChunksRef: RefObject<Blob[]>,
    options: UseMediaRecorderOptions,
    setStatus: (s: RecorderStatus) => void,
    stopTracks: (streamRef: RefObject<MediaStream | null>) => void,
    streamRef: RefObject<MediaStream | null>
): MediaRecorder {
    const mimeType = getSupportedMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = recorder;
    audioChunksRef.current = [];
    recorder.ondataavailable = (event: BlobEvent) => handleDataAvailable(event, audioChunksRef);
    recorder.onstop = () => handleStop(recorder, audioChunksRef, options, stopTracks, setStatus, streamRef);
    return recorder;
}

/**
 *  Event-Handler für das 'dataavailable'-Event des MediaRecorders.
 *  Fügt die verfügbaren Audio-Daten zum audioChunksRef hinzu.
 * @param event Das BlobEvent, das die verfügbaren Audio-Daten enthält.
 * @param audioChunksRef Ref, in dem die aufgenommenen Audio-Chunks gespeichert werden.
 */
function handleDataAvailable(event: BlobEvent, audioChunksRef: RefObject<Blob[]>): void {
    if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
    }
}

/**
 * Event-Handler für das 'stop'-Event des MediaRecorders.
 * Erstellt ein Blob aus den aufgenommenen Audio-Chunks und ruft die Callback-Funktion auf.
 * @param recorder Der MediaRecorder, der gestoppt wurde.
 * @param audioChunksRef Ref, in dem die aufgenommenen Audio-Chunks gespeichert werden.
 * @param options Optionen für den MediaRecorder.
 * @param stopTracks Funktion zum Stoppen der Audio-Tracks.
 * @param setStatus Funktion zum Setzen des Aufnahme-Status.
 */
function handleStop(
    recorder: MediaRecorder,
    audioChunksRef: RefObject<Blob[]>,
    options: UseMediaRecorderOptions,
    stopTracks: (streamRef: RefObject<MediaStream | null>) => void,
    setStatus: (s: RecorderStatus) => void,
    streamRef: RefObject<MediaStream | null>
): void {
    const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
    if (options.onRecordingComplete) {
        options.onRecordingComplete(audioBlob);
    }
    stopTracks(streamRef);
    setStatus('idle');
}

/**
 *  Stoppt alle Audio-Tracks im gegebenen MediaStream und setzt den Ref auf null.
 * @param streamRef Ref, in dem der MediaStream gespeichert ist.
 */
function stopTracks(streamRef: RefObject<MediaStream | null>): void {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
    }
}