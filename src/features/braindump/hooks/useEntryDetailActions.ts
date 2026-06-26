import { useState } from 'react';
import { useBrainDumpStore } from '../store';
import { useDeleteEntry, useDeleteOccurrence, useReprocessEntry, useUpdateEntry, useUpdateOccurrence } from '@/hooks';
import { useErrorToast, useSuccessToast } from '@/hooks';
import { getSuccessors, calcDeltaDays, addDays } from '../utils/dependencies';
import type { BrainDumpEntry, EntryPatch, RecurrenceScope } from '../types';

const DELETE_FEEDBACK = {
  deleted:   'Eintrag gelöscht.',
  not_found: 'Kein passender Eintrag gefunden.',
  error:     'Löschen fehlgeschlagen.',
} as const;

export function useEntryDetailActions(
  entry: BrainDumpEntry,
  onOpenChange: (open: boolean) => void,
) {
  const [isSaving,   setIsSaving]   = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shiftQueue, setShiftQueue] = useState<Array<{ entryId: string; delta: number }>>([]);

  const deleteEntryFn     = useDeleteEntry();
  const deleteOccurrenceFn = useDeleteOccurrence();
  const updateEntryFn     = useUpdateEntry();
  const reprocessEntryFn  = useReprocessEntry();
  const updateOccurrenceFn = useUpdateOccurrence();
  const showSuccessToast  = useSuccessToast();
  const showErrorToast    = useErrorToast();

  /** Returns true when the save succeeded (panel should close edit mode). */
  const save = async (patch: EntryPatch, editScope: RecurrenceScope | null): Promise<boolean> => {
    if (isSaving) return false;
    setIsSaving(true);
    try {
      let result;
      if (entry._isVirtualOccurrence) {
        const masterId = entry._seriesMasterId ?? entry.id;
        const occDate  = entry._occurrenceDate ?? entry.payload.date ?? '';
        result = await updateOccurrenceFn(masterId, occDate, patch, editScope ?? 'single');
      } else {
        result = await reprocessEntryFn(entry.id, patch);
      }

      if (result.status !== 'updated') {
        showErrorToast(result.status === 'error' ? result.message : 'Eintrag nicht gefunden.');
        return false;
      }

      if (!entry._isVirtualOccurrence) {
        const newDate = patch.payload?.date;
        const oldDate = entry.payload.date;
        if (newDate && oldDate && newDate !== oldDate) {
          const delta      = calcDeltaDays(oldDate, newDate);
          const fresh      = useBrainDumpStore.getState().entries;
          const violating  = getSuccessors(entry.id, fresh).filter(
            s => s.payload.date != null && s.payload.date < newDate
          );
          if (violating.length > 0) {
            setShiftQueue(violating.map(s => ({ entryId: s.id, delta })));
          }
        }
      }
      return true;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEntry = async (): Promise<void> => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const result = await deleteEntryFn(entry.id);
      if (result.status === 'deleted') {
        onOpenChange(false);
        showSuccessToast(DELETE_FEEDBACK.deleted);
      } else {
        showErrorToast(result.status === 'error' ? result.message : DELETE_FEEDBACK.not_found);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteScopedEntry = async (scope: RecurrenceScope): Promise<void> => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const masterId = entry._isVirtualOccurrence ? (entry._seriesMasterId ?? entry.id) : entry.id;
      const occDate  = entry._occurrenceDate ?? entry.payload.date ?? '';
      const result   = await deleteOccurrenceFn(masterId, occDate, scope);
      if (result.status === 'deleted') {
        onOpenChange(false);
        showSuccessToast(DELETE_FEEDBACK.deleted);
      } else {
        showErrorToast(result.status === 'error' ? result.message : DELETE_FEEDBACK.not_found);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const shiftConfirm = async (): Promise<void> => {
    const current = shiftQueue[0];
    if (!current) return;
    const fresh  = useBrainDumpStore.getState().entries;
    const target = fresh.find(e => e.id === current.entryId);
    if (!target?.payload.date) { setShiftQueue(prev => prev.slice(1)); return; }

    const newDate = addDays(target.payload.date, current.delta);
    const result  = await updateEntryFn(current.entryId, { payload: { ...target.payload, date: newDate } });

    const after         = useBrainDumpStore.getState().entries;
    const nextViolating = result.status === 'updated'
      ? getSuccessors(current.entryId, after).filter(s => s.payload.date != null && s.payload.date < newDate)
      : [];

    setShiftQueue(prev => [
      ...prev.slice(1),
      ...nextViolating.map(s => ({ entryId: s.id, delta: current.delta })),
    ]);
  };

  const shiftReject = () => setShiftQueue(prev => prev.slice(1));

  return { save, deleteEntry, deleteScopedEntry, isSaving, isDeleting, shiftQueue, shiftConfirm, shiftReject };
}
