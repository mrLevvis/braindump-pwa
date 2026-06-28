# Checkliste: Änderungen an einer Entry-Kategorie

Wenn du eine Kategorie (TASK, EVENT, NOTE, SHOPPING) anpasst — egal ob neues Feld, geändertes Verhalten, neues UI-Element oder entfernte Logik — musst du systematisch alle betroffenen Stellen mitziehen. Diese Liste ist die Pflichtprüfung.

---

## Die 7 Pflichtstellen

### 1. `EntryCard.tsx` — Kartenansicht in der Liste
**Datei:** `src/features/braindump/views/EntryCard.tsx`

- Zeigt die Kategorie korrekt an?
- Neues Feld sichtbar / altes Feld entfernt?
- Kartenkomponente (`TaskCard`, `EventCard`, `NoteCard`, `ShoppingCard`) angepasst?
- Props vollständig?

---

### 2. `EntryDetailPanel.tsx` — Detailansicht (Read-only)
**Datei:** `src/features/braindump/views/EntryDetailPanel.tsx`

- Neue Felder/Abschnitte ergänzt?
- Kategorie-spezifische Sections korrekt mit-konditioniert (`category === 'TASK'` etc.)?
- `PANEL_STYLES` ggf. angepasst?
- Verbundene Sub-Komponenten geprüft (z.B. `TimingCard`, `DeadlineCountdown`, `ShoppingItemsSection`)?

---

### 3. `EntryEditForm.tsx` — Bearbeitungsformular
**Datei:** `src/features/braindump/views/EntryEditForm.tsx`

- Neues Feld als lokaler State + JSX-Input ergänzt?
- `EntryPatch`-Objekt beim Submit vollständig?
- Konditionierung (welches Feld für welche Kategorie) korrekt?
- Kategorie-Switch-Logik (Zeile ~86) berücksichtigt — werden Felder beim Wechsel korrekt geleert?
- Validierung ergänzt wenn nötig?

---

### 4. `IngestPreviewSheet.tsx` — Vorschau vor dem Speichern
**Datei:** `src/features/braindump/views/IngestPreviewSheet.tsx`

- Neues Feld in der Vorschau sichtbar?
- Kategorie wird korrekt erkannt und vorgeschlagen?
- Stimmt die Vorschau inhaltlich mit dem überein, was später in Detail- und Kartenansicht gezeigt wird?

---

### 5. `BrainDump.ts` — Typen
**Datei:** `src/features/braindump/types/BrainDump.ts`

- `EntryPayload` um das neue Feld erweitert?
- `EntryPatch` ebenfalls erweitert?
- `BrainDumpEntry` konsistent?
- Typen optional vs. required korrekt gesetzt?

---

### 6. `BrainDumpStore.ts` — State & Mutations
**Datei:** `src/features/braindump/store/BrainDumpStore.ts`

- Neues Feld beim Fetch/Mapping berücksichtigt (`mapRow` in `ApiClient.ts`)?
- Update-Logik korrekt (`updateEntry`, `updateOccurrence`)?
- Kategorie-spezifische Cleanup-Logik (z.B. Shopping-Items löschen bei `deleteEntry`) angepasst?

---

### 7. `categoryStyles.tsx` — Styles & Badges
**Datei:** `src/features/braindump/categoryStyles.tsx`

- Styles konsistent über alle Kategorien?
- Neue Farben / Icons abgestimmt?

---

## Kategorie-spezifische Zusatzstellen

### TASK
| Was | Datei |
|-----|-------|
| Abhängigkeiten (Vorgänger/Nachfolger) | `EntryDetailPanel.tsx`, `EntryEditForm.tsx`, `utils/dependencies.ts` |
| Wiederholungsregeln | `RecurrencePickerSection.tsx`, `RecurrenceScopeDialog.tsx`, `seriesService.ts` |
| Priorität & Completion | `TaskCompletionDialog.tsx`, Store (`toggleTaskCompleted`) |
| Timeline-Darstellung | `src/features/timeline/` (GridBlock, buildTimelineBuckets, expandRecurringSeries) |

### EVENT
| Was | Datei |
|-----|-------|
| Mehrtageszeitraum | `EntryCard.tsx` (EventCard), `EntryDetailPanel.tsx` (TimingCard), `EntryEditForm.tsx` |
| Wiederholungsregeln | wie TASK |
| Timeline-Darstellung | wie TASK |

### NOTE
| Was | Datei |
|-----|-------|
| Keine Zeit/Datum-Felder | Wenn neue Felder, `EntryEditForm.tsx` Zeile ~86 (Reset beim Kategoriewechsel) prüfen |

### SHOPPING
| Was | Datei |
|-----|-------|
| Einzelne Items | `ShoppingItemsSection.tsx`, `ShoppingItemRow.tsx`, `ShoppingItemDetailPanel.tsx` |
| Preisberechnung | `ShoppingCard` in `EntryCard.tsx`, `shoppingUtils.ts` |
| Eigene Feature-Ansicht | `src/features/shopping/components/ShoppingView.tsx` |
| Shopping-spezifische Typen | `src/features/shopping/types/ShoppingItem.ts` |
| API / Store-Slice | `shoppingItemsService.ts`, `shoppingSlice.ts` |

---

## Zusätzliche Stellen, die oft vergessen werden

### API-Ebene
- `ApiClient.ts` → `mapRow`-Funktion: Neues DB-Feld → camelCase Domain-Feld mappen
- Supabase-Typen (`database.types.ts`) ggf. neu generieren
- Edge Function (AI-Verarbeitung): Neues Feld in den Prompt/Response einbeziehen? → `processBrainDump.ts`

### Selektoren / Hooks
- `src/hooks/braindumpSelectors.ts`: Falls neue abgeleitete Daten nötig
- `useEntryDetailActions.ts`: Falls Aktionen angepasst werden

### Timeline (TASK/EVENT)
- `expandRecurringSeries.ts`: Felder werden korrekt auf virtuelle Instanzen übertragen?
- `buildTimelineBuckets.ts`: Neue Zeitfelder korrekt verarbeitet?
- `GridBlock.tsx`: Darstellung im Grid angepasst?

### Filterlogik
- `applyCategoryFilter.ts`: Greift korrekt?

---

## Schnell-Checkliste (Copy-Paste)

```
[ ] EntryCard.tsx (Kartenkomponente der Kategorie)
[ ] EntryDetailPanel.tsx (Detail-Sections + PANEL_STYLES)
[ ] EntryEditForm.tsx (Formularfeld + EntryPatch + Kategorie-Reset)
[ ] IngestPreviewSheet.tsx (Vorschau-Darstellung)
[ ] BrainDump.ts (EntryPayload, EntryPatch, BrainDumpEntry)
[ ] BrainDumpStore.ts / ApiClient.ts mapRow (State + Mutations + Mapping)
[ ] categoryStyles.tsx (Styles konsistent)

--- Kategorie-spezifisch ---
TASK:
[ ] RecurrencePickerSection / RecurrenceScopeDialog / seriesService
[ ] TaskCompletionDialog
[ ] Timeline (GridBlock, buildTimelineBuckets, expandRecurringSeries)
[ ] dependencies.ts (Vorgänger/Nachfolger)

EVENT:
[ ] EventCard Mehrtageszeitraum
[ ] TimingCard in DetailPanel
[ ] Timeline (wie TASK)

SHOPPING:
[ ] ShoppingItemsSection / ShoppingItemRow / ShoppingItemDetailPanel
[ ] ShoppingView, ShoppingSection
[ ] shoppingSlice, shoppingItemsService
[ ] ShoppingItem.ts (Typen)
```
