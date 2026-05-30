/**
 * src/features/braindump/types/recording.ts
 * * Domänen-Modelle & Interfaces für die Audioaufnahme im BrainDump Feature.
 */

/**
 * Der Zustandsschnittstellen-Typ für die Audioaufnahme.
 * Dieser Vertrag definiert die State-Properties und Actions,
 * die von unserem Zustand-Management (z.B. Zustand) implementiert werden.
 * 
 * Derzeit enthält er nur die Audio-Blob und eine Methode zum Setzen des Blobs.
 * In zukünftigen Iterationen könnten hier weitere Properties (z.B. Aufnahmezeit, Dauer)
 * und Actions (z.B. startRecording, stopRecording) hinzugefügt werden.
 */


/**
 * Der Typ für den Zustandsschnittstellen des Recording-Slices.
 * Er enthält die aktuelle Audioaufnahme als Blob und eine Funktion zum Aktualisieren dieses Blobs.
 * Dieser Slice wird in unserem Zustand-Management (z.B. Zustand) verwendet, um die Audioaufnahme-Funktionalität zu kapseln.
 */
export interface RecordingSlice {
  audioBlob: Blob | null;
  setAudioBlob: (blob: Blob) => void;
}

/**
 * Die Typen für die useMediaRecorder Hook, die die Logik der Audioaufnahme kapselt.
 * Diese Schnittstellen definieren die Optionen, den Rückgabewert und den Status der Aufnahme.
 * Sie ermöglichen eine klare Trennung von Logik und UI, indem sie einen Vertrag für die Hook bereitstellen.
 */
export type RecorderStatus = 'idle' | 'requesting' | 'recording';

/**
 * Die Optionen, die an die useMediaRecorder Hook übergeben werden.
 * onRecordingComplete ist eine Pflichtfunktion, die aufgerufen wird, wenn die Aufnahme abgeschlossen ist.
 * onError ist eine optionale Funktion, die bei Fehlern (z.B. Berechtigungsverweigerung) aufgerufen wird.
 */
export interface UseMediaRecorderOptions {
  onRecordingComplete: (audio: Blob) => void;
  onError?: (error: Error) => void;
}

/**
 * Der Rückgabewert der useMediaRecorder Hook, der den aktuellen Status der Aufnahme,
 * eine Boolean-Flag für die Aufnahmeaktivität und die Funktionen zum Starten und Stoppen der Aufnahme enthält.
 */
export interface UseMediaRecorderResult {
  status: RecorderStatus;
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

/**
 * Die Props für die VoiceRecordButton-Komponente, die den aktuellen Status der Aufnahme und eine Klick-Handler-Funktion erwartet.
 * Diese Props ermöglichen es der Komponente, ihren Zustand (z.B. Farbe, Icon) basierend auf dem Aufnahme-Status zu ändern
 * und die Aufnahme zu starten oder zu stoppen, wenn der Button geklickt wird.
 */
export interface VoiceRecordButtonProps {
  status: RecorderStatus;
  onClick: () => void;
}