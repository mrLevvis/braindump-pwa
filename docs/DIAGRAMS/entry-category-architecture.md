# Entry-Kategorie-Architektur

## Überblick: Datenfluss

```
┌─────────────────────────────────────────────────────────────────┐
│                        INPUT-EBENE                              │
│   InputSection.tsx  ──►  processBrainDump.ts (Edge Fn / AI)    │
│                               │                                 │
│                    IngestPreviewSheet.tsx                       │
│                    (Vorschau, Kategorievorschlag)               │
│                               │                                 │
│                      [User bestätigt]                           │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       STATE-EBENE                               │
│                                                                 │
│   BrainDumpStore.ts                                             │
│   ├── entries[]  (BrainDumpEntry – alle Kategorien)             │
│   ├── ShoppingSlice  (shopping_items)                           │
│   └── recurrenceExceptions[]                                    │
│                                                                 │
│   ApiClient.ts  (mapRow: DB → Domain)                           │
│   seriesService.ts  (Recurrence-Operationen)                    │
└───────────────────────────────┬─────────────────────────────────┘
                                │
              ┌─────────────────┼──────────────────┐
              ▼                 ▼                  ▼
┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐
│  DASHBOARD      │  │  TIMELINE        │  │  SHOPPING       │
│  (Listenansicht)│  │  (TASK/EVENT)    │  │  (Eigene View)  │
│                 │  │                  │  │                 │
│  EntryList.tsx  │  │  TimelineView    │  │  ShoppingView   │
│  EntryCard.tsx  │  │  DayGrid         │  │  ShoppingSection│
│  ┌───────────┐  │  │  GridBlock       │  │  ShoppingItemRow│
│  │ TaskCard  │  │  │  expandRecurring │  │  ShoppingItem   │
│  │ EventCard │  │  │  buildBuckets    │  │  DetailPanel    │
│  │ NoteCard  │  │  └──────────────────┘  └─────────────────┘
│  │ShoppingCrd│  │
│  └───────────┘  │
└────────┬────────┘
         │  [Card tap]
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DETAIL / EDIT                              │
│                                                                 │
│  EntryDetailPanel.tsx                                           │
│  ├── TimingCard         (TASK, EVENT)                           │
│  ├── DeadlineCountdown  (TASK)                                  │
│  ├── ShoppingItemsSection (SHOPPING)                            │
│  ├── DependencySection  (TASK)                                  │
│  └── RecurrenceInfo     (TASK, EVENT)                           │
│            │                                                    │
│            │  [Edit-Button]                                     │
│            ▼                                                    │
│  EntryEditForm.tsx                                              │
│  ├── Datum / Zeit       (TASK, EVENT)                           │
│  ├── Deadline           (TASK)                                  │
│  ├── EndDatum           (EVENT)                                  │
│  ├── Recurrence         (TASK, EVENT)                           │
│  ├── Dependencies       (TASK)                                  │
│  └── Tags / Summary     (alle)                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Kategorie-Feature-Matrix

| Feature              | TASK | EVENT | NOTE | SHOPPING |
|----------------------|:----:|:-----:|:----:|:--------:|
| EntryCard            | ✓    | ✓     | ✓    | ✓        |
| Datum / Zeit         | ✓    | ✓     | –    | –        |
| Enddatum             | –    | ✓     | –    | –        |
| Deadline             | ✓    | –     | –    | –        |
| TimeOfDay            | ✓    | ✓     | –    | –        |
| Completion Toggle    | ✓    | –     | –    | –        |
| Wiederholung         | ✓    | ✓     | –    | –        |
| Abhängigkeiten       | ✓    | –     | –    | –        |
| Shopping-Items       | –    | –     | –    | ✓        |
| Timeline-Darstellung | ✓    | ✓     | –    | –        |
| Priorisierung (LLM)  | ✓    | –     | –    | –        |
| Eigene View          | –    | –     | –    | ✓        |

---

## Identifizierte Schwachstellen

### S1 — Kein zentrales Kategorie-Registry (KRITISCH)
**Problem:** Die Anwendung hat zwar ein `CARD_REGISTRY` für Karten, aber keins für Detail-Panel-Sections und Edit-Form-Felder. Stattdessen gibt es überall `if (category === 'TASK')` und `category === 'EVENT'`-Konditionierungen, die verstreut und nicht synchronisiert sind.

**Auswirkung:** Wenn eine neue Kategorie oder ein neues Feld hinzukommt, muss man manuell alle Konditionierungen finden und ergänzen — ohne Compile-Fehler, wenn man eine vergisst.

**Verbesserung:**
```typescript
// Zentrales Registry-Objekt, das alle Kategorie-spezifischen
// Komponenten + Felder + Capabilities beschreibt
const CATEGORY_REGISTRY: Record<EntryCategory, CategoryDefinition> = {
  TASK: {
    card: TaskCard,
    detailSections: [TimingSection, DeadlineSection, DependencySection, RecurrenceSection],
    editFields: ['date', 'time', 'deadline', 'recurrence', 'dependencies'],
    capabilities: { hasDate: true, hasDeadline: true, hasRecurrence: true },
  },
  // ...
}
```

---

### S2 — `EntryEditForm` ist eine God-Component (MITTEL)
**Problem:** `EntryEditForm.tsx` enthält alle Felder aller Kategorien in einer einzigen Komponente mit vielen verschachtelten Konditionierungen. Felder für TASK, EVENT, NOTE und SHOPPING sind alle drin, bedingt gerendert.

**Auswirkung:** Schwer lesbar, hohe Kopplung. Ein Fehler in TASK-Feldern kann NOTE-Felder zerbrechen. Schwer zu testen.

**Verbesserung:** Kategorie-spezifische Feld-Sektionen als eigene Komponenten auslagern (`TaskFields.tsx`, `EventFields.tsx` etc.), die `EntryEditForm` per Registry einbindet.

---

### S3 — IngestPreview ist von Detail- und Edit-Ansicht entkoppelt (MITTEL)
**Problem:** `IngestPreviewSheet.tsx` zeigt eine Vorschau des neuen Eintrags, aber diese ist unabhängig von den eigentlichen Anzeige-Komponenten implementiert. Wenn man `EntryDetailPanel` ändert, bleibt die Preview oft veraltet.

**Auswirkung:** UX-Inkonsistenz: Der Nutzer sieht in der Preview etwas anderes als nach dem Speichern.

**Verbesserung:** Preview sollte die gleichen Komponenten wie `EntryDetailPanel` nutzen (Readonly-Modus mit Draft-Daten), nicht eine separate Implementierung.

---

### S4 — Styling-Duplikation zwischen `categoryStyles.tsx` und `EntryDetailPanel.tsx` (NIEDRIG)
**Problem:** `categoryStyles.tsx` definiert `CATEGORY_STYLES`, aber `EntryDetailPanel.tsx` definiert zusätzlich `PANEL_STYLES` als separates Record-Objekt mit teilweise überlappenden Farbangaben.

**Auswirkung:** Farbänderungen müssen an zwei Stellen gepflegt werden. Können auseinanderlaufen.

**Verbesserung:** `PANEL_STYLES` in `categoryStyles.tsx` einziehen oder als Ableitung davon definieren.

---

### S5 — Shopping als Hybrid: Feature + Kategorie (MITTEL)
**Problem:** SHOPPING ist sowohl eine `EntryCategory` in `BrainDump.ts` als auch ein eigenes Feature unter `src/features/shopping/` mit eigenen Typen, eigenem Store-Slice und eigenem View. Die Grenze ist unklar: Was gehört in `braindump/`, was in `shopping/`?

**Auswirkung:** `ShoppingItemsSection` liegt in `braindump/views/`, aber `ShoppingItemRow` und `ShoppingItemDetailPanel` in `shopping/components/`. Konsistenz unklar, schwer zu navigieren.

**Verbesserung:** Klare Trennung: Alles Shopping-spezifische in `features/shopping/` — auch `ShoppingItemsSection`. Oder: SHOPPING komplett unter `braindump/` ohne eigenes Feature. Entscheidung treffen und durchziehen.

---

### S6 — Timeline kennt keine Kategorie-Abstraktion (NIEDRIG)
**Problem:** Die Timeline-Komponenten greifen direkt auf `entry.payload.date`, `.startTime`, `.endTime` etc. zu, ohne das Kategorie-System zu nutzen. Die Information "TASK und EVENT haben Zeitbezug" ist implizit.

**Auswirkung:** Wenn NOTE oder SHOPPING jemals Zeitfelder bekommen, muss die Timeline-Logik manuell erweitert werden.

**Verbesserung:** `capabilities.hasDate` (aus S1) als single source of truth nutzen, statt in Timeline direkt `category === 'TASK' || category === 'EVENT'` zu prüfen.

---

### S7 — Kein einheitlicher Validierungs-Layer (NIEDRIG)
**Problem:** Feldvalidierung findet implizit in `EntryEditForm.tsx` und der AI-Verarbeitung statt, aber es gibt keinen zentralen Validator pro Kategorie.

**Auswirkung:** Ungültige Einträge (z.B. TASK ohne Datum, obwohl in einer zeitgebundenen Ansicht) können entstehen.

---

## Empfohlene Sofortmaßnahmen (Quick Wins)

1. **`PANEL_STYLES` in `categoryStyles.tsx` zentralisieren** (S4) — 30 min, keine API-Änderung
2. **`EntryEditForm` in Feld-Sektionen aufteilen** (S2) — 2-3h, nur Refactoring
3. **`ShoppingItemsSection` in `features/shopping/` verschieben** (S5) — 1h, klare Grenze

## Empfohlene Mittelfrist-Maßnahmen

4. **Zentrales `CATEGORY_REGISTRY` einführen** (S1) — 4-6h, hoher Mehrwert
5. **`IngestPreviewSheet` auf `EntryDetailPanel` aufbauen** (S3) — 3-4h, UX-Verbesserung
