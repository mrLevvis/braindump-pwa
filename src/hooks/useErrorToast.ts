import { useCallback } from 'react';
import { toast } from 'sonner';

/**------------------------------------------------------------------------------ 
 * --- HOOK: useErrorToast ---
 * ------------------------------------------------------------------------------*/

/**
 * Ein React-Hook, der eine Funktion zum Anzeigen von Fehler-Toast-Nachrichten bereitstellt.
 * @returns Eine Funktion, die einen Fehler entgegennimmt und eine Toast-Nachricht anzeigt.
 */
export function showErrorToast(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  toast.error(message);
}

export function showSuccessToast(message: string) {
  toast.success(message);
}

export function useErrorToast() {
  return useCallback((error: unknown) => {
    showErrorToast(error);
  }, []);
}

export function useSuccessToast() {
  return useCallback((message: string) => {
    showSuccessToast(message);
  }, []);
}


/**------------------------------------------------------------------------------ 
 * --- INTERNAL HELPER FUNCTIONS ---
 * ------------------------------------------------------------------------------*/

