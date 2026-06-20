import { create } from "zustand";
import type { BrainDumpState, DeleteResult, EntryDraft, EntryPatch, IngestPreview, InsertEntry, RecurrenceScope, ToggleResult, UpdateResult } from "../types";
import { deleteEntry as deleteEntryFromApi, deleteEntriesByIds, deleteRecurrenceExceptionsForSeries, fetchEntries, fetchRecurrenceExceptions, insertEntries, insertEntry, insertRecurrenceException, toggleTaskCompleted as toggleApi, updateEntry as updateEntryApi } from "../services";
import { processText, reprocessEntryAI } from "../services/processBrainDump";
import { prioritizeDayTasks as prioritizeApi } from "../services/prioritizeTasks";
import { showErrorToast } from "../../../hooks/useErrorToast";
import { createShoppingSlice } from "../../shopping/store/shoppingSlice";
import type { ShoppingSlice } from "../../shopping/store/shoppingSlice";

/**
 * Globaler Zustand-Store für das BrainDump-Feature.
 * Hält Einträge + Statusflags. ShoppingSlice ist per Zustand-Slice-Pattern eingemischt.
 */
export const useBrainDumpStore = create<BrainDumpState & ShoppingSlice>()((...a) => {
  const set = a[0];
  const get = a[1];
  return {
    ...createShoppingSlice((partial) => set(partial), get),
    // --- INITIAL STATE ---
    entries: [],
    recurrenceExceptions: [],
    isRecording: false,
    isProcessing: false,
    isPrioritizing: false,
    pendingPreview: null,
    prioritizedDays: {},

    // --- ACTIONS (MUTATIONS) ---
    setRecording: (status: boolean) => {
        set(() => ({ isRecording: status }));
    },

    setProcessing: (status: boolean) => {
        set(() => ({ isProcessing: status }));
    },

    updateEntryList: () => {
        fetchEntries().then((data) => {
            if (data) set(() => ({ entries: data }));
        });
        fetchRecurrenceExceptions().then((data) => {
            set(() => ({ recurrenceExceptions: data }));
        });
    },

    clearData: () => {
        set(() => ({ entries: [], recurrenceExceptions: [], items: [] }));
    },

    submitText: async (text: string) => {
        set(() => ({ isProcessing: true }));
        try {
            // 1. Text von der KI strukturieren lassen — liefert captureId + entries[].
            const { captureId, entries } = await processText(text);

            // 2. Drafts für die Preview zusammenbauen — kein DB-Insert hier.
            const drafts: EntryDraft[] = entries.map((e) => ({
                title: e.title,
                original_text: text,
                category: e.category,
                payload: e.payload,
                captureId,
                sourceExcerpt: e.sourceExcerpt,
                summary: e.summary,
                completed: false,
                recurrence: e.recurrence ?? null,
            }));

            set(() => ({ pendingPreview: { captureId, drafts } }));
        } catch (e) {
            throw e;
        } finally {
            set(() => ({ isProcessing: false }));
        }
    },

    confirmIngest: async (preview: IngestPreview) => {
        const newEntries: InsertEntry[] = preview.drafts.map((d) => ({
            title: d.title,
            original_text: d.original_text,
            category: d.category,
            payload: d.payload,
            capture_id: d.captureId,
            source_excerpt: d.sourceExcerpt,
            summary: d.summary,
            completed: d.category === 'TASK' ? false : null,
            recurrence: d.recurrence ?? null,
        }));

        await insertEntries(newEntries);
        const [data, exceptions] = await Promise.all([fetchEntries(), fetchRecurrenceExceptions()]);
        if (data) set(() => ({ entries: data, recurrenceExceptions: exceptions }));
        set(() => ({ pendingPreview: null }));
        get().loadItems();
    },

    discardIngest: (_captureId: string) => {
        set(() => ({ pendingPreview: null }));
    },

    deleteEntry: async (id: string): Promise<DeleteResult> => {
        const result = await deleteEntryFromApi(id);

        if (result.status === 'deleted') {
            const data = await fetchEntries();
            if (data) set(() => ({ entries: data }));
        }

        return result;
    },

    deleteOccurrence: async (masterId: string, date: string, scope: RecurrenceScope): Promise<DeleteResult> => {
        if (scope === 'all') {
            // Serien-Master löschen → cascade auf Exceptions
            return get().deleteEntry(masterId);
        }
        if (scope === 'single') {
            // Exception eintragen: diese eine Occurrence als gelöscht markieren
            const exc = await insertRecurrenceException({
                series_entry_id: masterId,
                original_date: date,
                type: 'deleted',
                override_entry_id: null,
            });
            if (!exc) return { status: 'error', message: 'Exception konnte nicht gespeichert werden.' };
            const exceptions = await fetchRecurrenceExceptions();
            set(() => ({ recurrenceExceptions: exceptions }));
            return { status: 'deleted' };
        }
        // scope === 'following': Master-Regel bis zum Vortag kürzen
        const master = get().entries.find(e => e.id === masterId);
        if (!master?.recurrence) return { status: 'not_found' };
        // Vortag = Datum vor `date`
        const prevDate = new Date(`${date}T00:00:00`);
        prevDate.setDate(prevDate.getDate() - 1);
        const untilDate = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`;
        const updatedRule = { ...master.recurrence, end: { type: 'until' as const, date: untilDate } };
        const result = await updateEntryApi(masterId, { recurrence: updatedRule });
        if (result.status === 'updated') {
            // Exceptions ab `date` für diese Serie löschen
            await deleteRecurrenceExceptionsForSeries(masterId, date);
            const [entries, exceptions] = await Promise.all([fetchEntries(), fetchRecurrenceExceptions()]);
            if (entries) set(() => ({ entries, recurrenceExceptions: exceptions }));
        }
        return result.status === 'updated' ? { status: 'deleted' } : result;
    },

    updateOccurrence: async (masterId: string, date: string, patch: EntryPatch, scope: RecurrenceScope): Promise<UpdateResult> => {
        if (scope === 'all') {
            return get().updateEntry(masterId, patch);
        }
        if (scope === 'single') {
            // Override-Entry anlegen und Exception registrieren
            const master = get().entries.find(e => e.id === masterId);
            if (!master) return { status: 'not_found' };
            const overrideInsert = {
                title: patch.title ?? master.title,
                original_text: master.original_text,
                category: master.category,
                payload: { ...master.payload, date, ...(patch.payload ?? {}) },
                capture_id: master.captureId,
                source_excerpt: master.sourceExcerpt,
                summary: patch.summary ?? master.summary,
                completed: null as null,
                series_entry_id: masterId,
            };
            const inserted = await insertEntry(overrideInsert);
            if (!inserted) return { status: 'error', message: 'Override-Entry konnte nicht gespeichert werden.' };
            // inserted ist der raw insert result — wir müssen den Entry-ID aus freshEntries holen
            const freshEntries = await fetchEntries();
            if (!freshEntries) return { status: 'error', message: 'Einträge konnten nicht geladen werden.' };
            const override = freshEntries.find(e => e.seriesEntryId === masterId && e.payload.date === date);
            if (!override) return { status: 'error', message: 'Override-Entry nicht gefunden.' };
            await insertRecurrenceException({
                series_entry_id: masterId,
                original_date: date,
                type: 'modified',
                override_entry_id: override.id,
            });
            const exceptions = await fetchRecurrenceExceptions();
            set(() => ({ entries: freshEntries, recurrenceExceptions: exceptions }));
            return { status: 'updated' };
        }
        // scope === 'following': Master bis Vortag kürzen + neue Serie ab `date` anlegen
        const master = get().entries.find(e => e.id === masterId);
        if (!master?.recurrence) return { status: 'not_found' };
        const prevDate = new Date(`${date}T00:00:00`);
        prevDate.setDate(prevDate.getDate() - 1);
        const untilDate = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`;
        await updateEntryApi(masterId, { recurrence: { ...master.recurrence, end: { type: 'until' as const, date: untilDate } } });
        await deleteRecurrenceExceptionsForSeries(masterId, date);
        const newMaster = {
            title: patch.title ?? master.title,
            original_text: master.original_text,
            category: master.category,
            payload: { ...master.payload, date, ...(patch.payload ?? {}) },
            summary: patch.summary ?? master.summary,
            completed: null as null,
            recurrence: patch.recurrence ?? master.recurrence,
        };
        await insertEntry(newMaster);
        const [entries, exceptions] = await Promise.all([fetchEntries(), fetchRecurrenceExceptions()]);
        if (entries) set(() => ({ entries, recurrenceExceptions: exceptions }));
        return { status: 'updated' };
    },

    deleteEntries: async (ids: readonly string[]): Promise<void> => {
        await deleteEntriesByIds(ids);
        const data = await fetchEntries();
        if (data) set(() => ({ entries: data }));
    },

    prioritizeDayTasks: async (date, tasks) => {
        set(() => ({ isPrioritizing: true }));
        try {
            const result = await prioritizeApi(tasks);
            set(s => ({ prioritizedDays: { ...s.prioritizedDays, [date]: result.orderedTaskIds } }));
        } catch (e) {
            showErrorToast(`Priorisierung fehlgeschlagen: ${(e as Error).message}`);
        } finally {
            set(() => ({ isPrioritizing: false }));
        }
    },

    updateEntry: async (id: string, patch: EntryPatch): Promise<UpdateResult> => {
        set(s => ({
            entries: s.entries.map(e =>
                e.id === id
                    ? { ...e, ...patch, payload: { ...e.payload, ...(patch.payload ?? {}) } }
                    : e
            ),
        }));

        const result = await updateEntryApi(id, patch);

        if (result.status !== 'updated') {
            const data = await fetchEntries();
            if (data) set(() => ({ entries: data }));
            if (result.status === 'error') showErrorToast(result.message);
        }

        return result;
    },

    reprocessEntry: async (id: string, patch: EntryPatch): Promise<UpdateResult> => {
        const currentEntry = get().entries.find(e => e.id === id);
        if (!currentEntry) return { status: 'not_found' };

        // Only run AI when the text content changed; otherwise fall back to a plain update.
        const hasTextChange = 'title' in patch || 'summary' in patch;
        if (!hasTextChange) return get().updateEntry(id, patch);

        const effectiveTitle = 'title' in patch ? patch.title : currentEntry.title;
        const effectiveSummary = 'summary' in patch ? patch.summary : currentEntry.summary;
        const textParts = [effectiveTitle, ...(effectiveSummary ?? [])].filter((p): p is string => Boolean(p));
        const text = textParts.join('. ') || currentEntry.original_text;

        let finalPatch: EntryPatch;
        try {
            const aiEntry = await reprocessEntryAI(text, currentEntry.captureId);
            // Patch fields take precedence for explicitly changed fields; AI fills the rest.
            finalPatch = {
                title: 'title' in patch ? patch.title : aiEntry.title,
                category: 'category' in patch ? patch.category : aiEntry.category,
                summary: 'summary' in patch ? patch.summary : aiEntry.summary,
                recurrence: 'recurrence' in patch ? patch.recurrence : (aiEntry.recurrence ?? null),
                payload: {
                    ...aiEntry.payload,
                    ...(patch.payload ?? {}),
                },
            };
        } catch {
            // AI unavailable — save only the manual changes so the user's edit is not lost.
            finalPatch = patch;
        }

        set(s => ({
            entries: s.entries.map(e =>
                e.id === id
                    ? { ...e, ...finalPatch, payload: { ...e.payload, ...(finalPatch.payload ?? {}) } }
                    : e
            ),
        }));

        const result = await updateEntryApi(id, finalPatch);

        if (result.status !== 'updated') {
            const data = await fetchEntries();
            if (data) set(() => ({ entries: data }));
            if (result.status === 'error') showErrorToast(result.message);
        } else if (finalPatch.category === 'SHOPPING' || currentEntry.category === 'SHOPPING') {
            get().loadItems();
        }

        return result;
    },

    toggleTaskCompleted: async (id: string, completed: boolean): Promise<ToggleResult> => {
        // Optimistic update — flip the flag immediately for instant UI feedback.
        set(s => ({
            entries: s.entries.map(e => e.id === id ? { ...e, completed } : e),
        }));

        const result = await toggleApi(id, completed);

        if (result.status !== 'toggled') {
            // Revert on any failure to keep UI consistent with DB state.
            set(s => ({
                entries: s.entries.map(e => e.id === id ? { ...e, completed: !completed } : e),
            }));
            if (result.status === 'error') showErrorToast(result.message);
        }

        return result;
    },
  };
});