import type { StateCreator } from 'zustand';
import type { RecordingSlice } from '../types';


/**
 * Erstellt den Zustandsslice für die Audioaufnahme, einschließlich des Audio-Blobs und der Funktion zum Aktualisieren dieses Blobs.
 * Dieser Slice wird in unserem Zustand-Management (z.B. Zustand) verwendet, um die Audioaufnahme-Funktionalität zu kapseln.
 * @param set Die Funktion zum Aktualisieren des Zustands.
 * @returns Ein Objekt, das den Zustandsslice für die Audioaufnahme enthält.
 */
export const createRecordingSlice: StateCreator<RecordingSlice> = (set) => ({

  /*------------------------------------------------------------------------------ 
   * --- INITIAL STATE ---
   * ------------------------------------------------------------------------------*/

  audioBlob: null,


  /*------------------------------------------------------------------------------ 
   * --- ACTIONS (MUTATIONS) ---
   * ------------------------------------------------------------------------------*/

  /** Setzt den Audio-Blob im Zustand */
  setAudioBlob: (blob) => {
    set({ audioBlob: blob });
  },
});