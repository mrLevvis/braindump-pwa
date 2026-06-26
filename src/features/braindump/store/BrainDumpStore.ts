import { create } from "zustand";
import type { BrainDumpState, ContextEntry, DeleteResult, EntryDraft, EntryPatch, IngestPreview, InsertEntry, RecurrenceScope, ToggleResult, UpdateResult } from "../types";
import { deleteEntry as deleteEntryFromApi, deleteEntriesByIds, fetchEntries, fetchRecurrenceExceptions, insertEntries, insertRecurrenceException, toggleTaskCompleted as toggleApi, updateEntry as updateEntryApi, updateEntryDependsOn as updateDependsOnApi } from "../services";
import { createSingleOverride, deleteFollowing, splitSeriesAt } from "../services/seriesService";
import { processText, reprocessEntryAI } from "../services/processBrainDump";
import { prioritizeDayTasks as prioritizeApi } from "../services/prioritizeTasks";
import { showErrorToast } from "../../../hooks/useErrorToast";
import { createShoppingSlice } from "../../shopping/store/shoppingSlice";
import type { ShoppingSlice } from "../../shopping/store/shoppingSlice";
import {
  addShoppingItem as addShoppingItemToDb,
  deleteShoppingItem,
  deleteShoppingItemsBySourceDump,
  fetchShoppingItems,
  updateShoppingItemLabel,
} from "../../shopping/services/shoppingItemsService";

/**
 * Globaler Zustand-Store für das BrainDump-Feature.
 * Hält Einträge + Statusflags. ShoppingSlice ist per Zustand-Slice-Pattern eingemischt.
 */
export const useBrainDumpStore = create<BrainDumpState & ShoppingSlice>()((...a) => {
  const set = a[0];
  const get = a[1];

  // Full state refresh after mutations that affect both entries and exceptions.
  // Optimistic actions (toggle, updateEntry) skip this and revert on failure instead.
  const refreshAll = async () => {
    const [entries, exceptions] = await Promise.all([fetchEntries(), fetchRecurrenceExceptions()]);
    if (entries) set(() => ({ entries, recurrenceExceptions: exceptions }));
  };

  // Syncs payload.tags on the shopping entry to the current item labels,
  // and refreshes the global items list — called after any item mutation.
  const syncShoppingEntry = async (captureId: string) => {
    const allItems = await fetchShoppingItems();
    const tags = allItems.filter(i => i.source_dump === captureId).map(i => i.label);
    const entry = get().entries.find(e => e.captureId === captureId);
    if (entry) {
      await updateEntryApi(entry.id, { payload: { ...entry.payload, tags } });
      set(s => ({
        items: allItems,
        entries: s.entries.map(e =>
          e.id === entry.id ? { ...e, payload: { ...e.payload, tags } } : e
        ),
      }));
    } else {
      set({ items: allItems });
    }
  };

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

    updateEntryList: async () => {
        await refreshAll();
    },

    clearData: () => {
        set(() => ({ entries: [], recurrenceExceptions: [], items: [] }));
    },

    submitText: async (text: string) => {
        set(() => ({ isProcessing: true }));
        try {
            // Bestehende Nicht-NOTE-Entries als Kontext mitschicken, damit die KI
            // Zusatzinfos erkennen und targetEntryId korrekt setzen kann.
            const contextEntries: ContextEntry[] = get().entries
                .filter(e => e.category !== 'NOTE' && e.id)
                .map(e => ({ id: e.id, title: e.title ?? '', category: e.category }));

            // 1. Text von der KI strukturieren lassen — liefert captureId + entries[].
            const { captureId, entries, additionalInfos } = await processText(text, contextEntries);

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

            set(() => ({ pendingPreview: { captureId, drafts, additionalInfos } }));
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

        // Zusatzinfos an bestehende Entries anhängen (summary erweitern).
        if (preview.additionalInfos && preview.additionalInfos.length > 0) {
            const currentEntries = get().entries;
            await Promise.all(
                preview.additionalInfos.map(({ targetEntryId, content }) => {
                    const target = currentEntries.find(e => e.id === targetEntryId);
                    if (!target) return Promise.resolve();
                    return updateEntryApi(targetEntryId, { summary: [...(target.summary ?? []), content] });
                })
            );
        }

        await refreshAll();
        set(() => ({ pendingPreview: null }));
        get().loadItems();
    },

    discardIngest: (_captureId: string) => {
        set(() => ({ pendingPreview: null }));
    },

    deleteEntry: async (id: string): Promise<DeleteResult> => {
        const entry = get().entries.find(e => e.id === id);

        if (entry?.category === 'SHOPPING' && entry.captureId) {
            await deleteShoppingItemsBySourceDump(entry.captureId);
        }

        const result = await deleteEntryFromApi(id);

        if (result.status === 'deleted') {
            const data = await fetchEntries();
            if (data) set(() => ({ entries: data }));
            if (entry?.category === 'SHOPPING') get().loadItems();
        }

        return result;
    },

    deleteOccurrence: async (masterId: string, date: string, scope: RecurrenceScope): Promise<DeleteResult> => {
        if (scope === 'all') {
            return get().deleteEntry(masterId);
        }
        if (scope === 'single') {
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
        // scope === 'following'
        const result = await deleteFollowing(masterId, date, get().entries);
        if (result.status === 'deleted') await refreshAll();
        return result;
    },

    updateOccurrence: async (masterId: string, date: string, patch: EntryPatch, scope: RecurrenceScope): Promise<UpdateResult> => {
        if (scope === 'all') {
            return get().updateEntry(masterId, patch);
        }
        if (scope === 'single') {
            const result = await createSingleOverride(masterId, date, patch, get().entries);
            if (result.status === 'updated') await refreshAll();
            return result;
        }
        // scope === 'following'
        const result = await splitSeriesAt(masterId, date, patch, get().entries);
        if (result.status === 'updated') await refreshAll();
        return result;
    },

    deleteEntries: async (ids: readonly string[]): Promise<void> => {
        const shoppingCaptureIds = [
            ...new Set(
                get().entries
                    .filter(e => ids.includes(e.id) && e.category === 'SHOPPING' && e.captureId)
                    .map(e => e.captureId!)
            ),
        ];
        await Promise.all(shoppingCaptureIds.map(deleteShoppingItemsBySourceDump));
        await deleteEntriesByIds(ids);
        const data = await fetchEntries();
        if (data) set(() => ({ entries: data }));
        if (shoppingCaptureIds.length > 0) get().loadItems();
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

        const result = await updateEntryApi(id, patch); // dependsOn wird intern gestripped

        if (patch.dependsOn !== undefined && result.status === 'updated') {
            await updateDependsOnApi(id, patch.dependsOn);
        }

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
                    ? {
                        ...e,
                        ...finalPatch,
                        payload: { ...e.payload, ...(finalPatch.payload ?? {}) },
                        ...(patch.dependsOn !== undefined ? { dependsOn: patch.dependsOn } : {}),
                      }
                    : e
            ),
        }));

        const result = await updateEntryApi(id, finalPatch);

        if (patch.dependsOn !== undefined && result.status === 'updated') {
            await updateDependsOnApi(id, patch.dependsOn);
        }

        if (result.status !== 'updated') {
            const data = await fetchEntries();
            if (data) set(() => ({ entries: data }));
            if (result.status === 'error') showErrorToast(result.message);
        } else if (finalPatch.category === 'SHOPPING' || currentEntry.category === 'SHOPPING') {
            get().loadItems();
        }

        return result;
    },

    addItemToEntry: async (captureId: string, label: string) => {
      try {
        await addShoppingItemToDb(captureId, label);
        await syncShoppingEntry(captureId);
      } catch (e) {
        showErrorToast((e as Error).message);
      }
    },

    updateItemLabel: async (itemId: string, captureId: string, label: string) => {
      const result = await updateShoppingItemLabel(itemId, label);
      if (result.status === 'error') { showErrorToast(result.message); return; }
      await syncShoppingEntry(captureId);
    },

    removeItemFromEntry: async (itemId: string, captureId: string) => {
      const result = await deleteShoppingItem(itemId);
      if (result.status === 'error') { showErrorToast(result.message); return; }
      await syncShoppingEntry(captureId);
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