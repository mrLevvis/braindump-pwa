import { useCallback } from 'react';

/**------------------------------------------------------------------------------ 
 * --- HOOK: useErrorToast ---
 * ------------------------------------------------------------------------------*/

/**
 * Ein React-Hook, der eine Funktion zum Anzeigen von Fehler-Toast-Nachrichten bereitstellt.
 * @returns Eine Funktion, die einen Fehler entgegennimmt und eine Toast-Nachricht anzeigt.
 */
export function useErrorToast() {
  return useCallback((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    // Hier könnte ein echtes Toast-System integriert werden
    alert(message);
  }, []);
}


/**------------------------------------------------------------------------------ 
 * --- INTERNAL HELPER FUNCTIONS ---
 * ------------------------------------------------------------------------------*/

