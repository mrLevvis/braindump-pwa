# Zustand Store Guide

Dieser Guide erklärt, wie der globale State in diesem Projekt funktioniert und wie man ihn richtig benutzt.

---

## Was ist Zustand?

Zustand ist eine schlanke State-Management-Library für React. Im Gegensatz zu `useState` (der nur innerhalb einer Komponente lebt) ist der Store **global** — jede Komponente kann ihn lesen und beschreiben, ohne Props weiterzureichen.

**Faustregeln:**
- `useState` → lokaler UI-State (z.B. Inhalt eines Textfeldes)
- Zustand Store → geteilter State, der mehrere Komponenten betrifft (z.B. Liste der Einträge, Ladezustand)

---

## Alle Stores im Überblick

Das Projekt hat fünf eigenständige Stores — aufgeteilt nach Feature-Grenze, nicht nach technischem Muster. Für häufig gebrauchte State-Slices gibt es Selektoren-Hooks in `src/hooks/`.

| Store | Datei | Zuständigkeit |
| :--- | :--- | :--- |
| `useBrainDumpStore` | `features/braindump/store/BrainDumpStore.ts` | Einträge, KI-Verarbeitung, Preview, Priorisierung |
| `useDaySelectionStore` | `features/timeline/store/DaySelectionStore.ts` | Ausgewählter Tag der Timeline |
| `useZoomStore` | `features/timeline/store/ZoomStore.ts` | Zoom-Level der Timeline (px/Stunde) |
| `useCategoryFilterStore` | `features/braindump/store/CategoryFilterStore.ts` | Aktive Kategorie-Filter im Dashboard |
| `useAuthStore` | `store/authSlice.ts` | Eingeloggter Supabase-User |

---

## BrainDump-Store

```
src/features/braindump/store/BrainDumpStore.ts
```

Der Haupt-Store des Kern-Features. Bündelt Eintrags-State, KI-Verarbeitungs-State und die Ingest-Preview.

### State & Actions

| Name | Typ | Bedeutung |
| :--- | :--- | :--- |
| `entries` | `BrainDumpEntry[]` | Alle Einträge aus der DB |
| `isRecording` | `boolean` | Ist die Sprachaufnahme aktiv? |
| `isProcessing` | `boolean` | Wird ein Eintrag von der KI verarbeitet? |
| `isPrioritizing` | `boolean` | Läuft eine KI-Priorisierung? |
| `pendingPreview` | `IngestPreview \| null` | KI-Ergebnis, das auf Bestätigung wartet |
| `prioritizedDays` | `Record<string, readonly string[]>` | Ephemere Priorisierung: Datum → geordnete Entry-IDs |
| `setRecording(bool)` | Action | Setzt `isRecording` |
| `setProcessing(bool)` | Action | Setzt `isProcessing` |
| `submitText(text)` | Action (async) | Text → Edge Function → `pendingPreview` setzen |
| `confirmIngest(preview)` | Action (async) | Preview-Drafts in DB schreiben, Preview schließen |
| `discardIngest(captureId)` | Action | Preview verwerfen ohne DB-Write |
| `deleteEntry(id)` | Action (async) → `DeleteResult` | Einzelnen Eintrag löschen |
| `deleteEntries(ids)` | Action (async) | Mehrere Einträge löschen (Auswahl-Modus) |
| `toggleTaskCompleted(id, completed)` | Action (async) → `ToggleResult` | `completed`-Feld toggeln |
| `updateEntry(id, patch)` | Action (async) → `UpdateResult` | Titel, Kategorie oder Payload bearbeiten |
| `updateEntryList()` | Action (async) | Frisch aus DB laden |
| `prioritizeDayTasks(date, tasks)` | Action (async) | Tasks eines Tages per KI priorisieren (kein DB-Write) |

### Selektoren-Hooks (bevorzugen!)

Für die am häufigsten genutzten State-Slices gibt es fertige Selektoren in `src/hooks/braindumpSelectors.ts`:

```typescript
import { useEntries, useIsProcessing, useSubmitText } from '../hooks/braindumpSelectors';
```

---

## Day-Selection-Store

```
src/features/timeline/store/DaySelectionStore.ts
```

Hält ausschließlich den ausgewählten Tag der Timeline-Ansicht. Initialisiert sich beim ersten Laden aus der URL (via `parseAppRoute`), um einen Flash zu vermeiden.

| Name | Typ | Bedeutung |
| :--- | :--- | :--- |
| `selectedDate` | `string` (YYYY-MM-DD) | Aktuell angezeigter Tag |
| `goToToday()` | Action | Setzt `selectedDate` auf heute |
| `setSelectedDate(date)` | Action | Setzt einen beliebigen Tag direkt |

In der Praxis wird er meistens über die Selektoren in `hooks/timelineSelectors.ts` konsumiert.

---

## Zoom-Store

```
src/features/timeline/store/ZoomStore.ts
```

Steuert den vertikalen Zoom des Timeline-Grids (Pixel pro Stunde). Wird per Pinch-Geste auf Mobile oder per Scroll-Event auf Desktop verändert.

| Name | Typ | Bedeutung |
| :--- | :--- | :--- |
| `pxPerHour` | `number` | Aktuelle Höhe einer Stunde in Pixeln |
| `setPxPerHour(next)` | Action | Setzt neuen Wert, geclampt auf [MIN, MAX] |

---

## Category-Filter-Store

```
src/features/braindump/store/CategoryFilterStore.ts
```

Hält die aktiven Kategorie-Filter im Dashboard (TASK, EVENT, NOTE, SHOPPING). Leeres Array = kein Filter aktiv = alle Einträge werden angezeigt.

| Name | Typ | Bedeutung |
| :--- | :--- | :--- |
| `activeCategories` | `readonly EntryCategory[]` | Aktuell aktive Kategorie-Filter |
| `toggleCategory(category)` | Action | Kategorie an/abschalten |
| `clearFilter()` | Action | Alle Filter zurücksetzen |

---

## Auth-Store

```
src/store/authSlice.ts
```

Hält den aktuell eingeloggten Supabase-User. Wird in `App.tsx` beim Session-Start gesetzt und bei `onAuthStateChange` aktuell gehalten.

| Name | Typ | Bedeutung |
| :--- | :--- | :--- |
| `user` | `User \| null` | Aktueller Supabase-User (oder null wenn ausgeloggt) |
| `setUser(user)` | Action | Setzt den User (intern von App.tsx aufgerufen) |

---

## Store lesen und benutzen

### Der Hook

Man übergibt eine **Selector-Funktion**, die genau das aus dem Store herausholt, was die Komponente braucht:

```typescript
import { useBrainDumpStore } from '../store';

const entries = useBrainDumpStore((state) => state.entries);
```

### Wichtig: Immer nur das Nötige selektieren

```typescript
// Gut — Komponente rendert nur neu, wenn sich entries ändert:
const entries = useBrainDumpStore((state) => state.entries);

// Schlecht — Komponente rendert bei jeder State-Änderung neu:
const store = useBrainDumpStore((state) => state);
```

---

## Wie `set` funktioniert

```typescript
// Variante 1 — einfache Überschreibung:
set(() => ({ isProcessing: true }));

// Variante 2 — basierend auf dem aktuellen State:
set((state) => ({ entries: [newEntry, ...state.entries] }));
```

Variante 2 braucht man immer dann, wenn der neue Wert vom alten abhängt.

---

## Wie eine neue Action hinzugefügt wird

In `BrainDumpStore.ts` ein neues Feld im `create(...)`-Objekt ergänzen:

```typescript
// 1. Typ in BrainDump.ts erweitern:
interface BrainDumpState {
  // ...
  clearEntries: () => void;
}

// 2. Action im Store implementieren:
clearEntries: () => {
  set(() => ({ entries: [] }));
}
```

`set(...)` überschreibt **nur** die angegebenen Felder — alles andere bleibt unverändert.
