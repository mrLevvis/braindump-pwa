import type { BrainDumpEntry, DeleteResult, EntryPatch, UpdateResult } from '../types';
import {
    deleteRecurrenceExceptionsForSeries,
    insertEntry,
    insertRecurrenceException,
    updateEntry as updateEntryApi,
} from './ApiClient';

function prevDayStr(date: string): string {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Kürzt den Master bis zum Vortag von `date` und löscht alle Exceptions ab `date`. */
export async function deleteFollowing(
    masterId: string,
    date: string,
    entries: readonly BrainDumpEntry[],
): Promise<DeleteResult> {
    const master = entries.find(e => e.id === masterId);
    if (!master?.recurrence) return { status: 'not_found' };

    const untilDate = prevDayStr(date);
    const result = await updateEntryApi(masterId, {
        recurrence: { ...master.recurrence, end: { type: 'until', date: untilDate } },
    });
    if (result.status !== 'updated') return result.status === 'error' ? result : { status: 'not_found' };

    await deleteRecurrenceExceptionsForSeries(masterId, date);
    return { status: 'deleted' };
}

/** Kürzt den Master bis Vortag, löscht Exceptions ab `date`, legt neuen Master ab `date` an. */
export async function splitSeriesAt(
    masterId: string,
    date: string,
    patch: EntryPatch,
    entries: readonly BrainDumpEntry[],
): Promise<UpdateResult> {
    const master = entries.find(e => e.id === masterId);
    if (!master?.recurrence) return { status: 'not_found' };

    const untilDate = prevDayStr(date);
    await updateEntryApi(masterId, {
        recurrence: { ...master.recurrence, end: { type: 'until', date: untilDate } },
    });
    await deleteRecurrenceExceptionsForSeries(masterId, date);
    await insertEntry({
        title: patch.title ?? master.title,
        original_text: master.original_text,
        category: master.category,
        payload: { ...master.payload, date, ...(patch.payload ?? {}) },
        summary: patch.summary ?? master.summary,
        completed: null,
        recurrence: patch.recurrence ?? master.recurrence,
    });
    return { status: 'updated' };
}

/** Legt einen Override-Entry für eine einzelne Occurrence an und registriert eine Exception. */
export async function createSingleOverride(
    masterId: string,
    date: string,
    patch: EntryPatch,
    entries: readonly BrainDumpEntry[],
): Promise<UpdateResult> {
    const master = entries.find(e => e.id === masterId);
    if (!master) return { status: 'not_found' };

    const inserted = await insertEntry({
        title: patch.title ?? master.title,
        original_text: master.original_text,
        category: master.category,
        payload: { ...master.payload, date, ...(patch.payload ?? {}) },
        capture_id: master.captureId,
        source_excerpt: master.sourceExcerpt,
        summary: patch.summary ?? master.summary,
        completed: null,
        series_entry_id: masterId,
    });
    if (!inserted) return { status: 'error', message: 'Override-Entry konnte nicht gespeichert werden.' };

    await insertRecurrenceException({
        series_entry_id: masterId,
        original_date: date,
        type: 'modified',
        override_entry_id: inserted.id,
    });
    return { status: 'updated' };
}
