# Zustand Store Guide

Dieser Guide erklärt, wie der globale State in diesem Projekt funktioniert und wie man ihn richtig benutzt.

---

## Was ist Zustand?

Zustand ist eine schlanke State-Management-Library für React. Im Gegensatz zu `useState` (der nur innerhalb einer Komponente lebt) ist der Store **global** — jede Komponente kann ihn lesen und beschreiben, ohne Props weiterzureichen.

**Faustregeln:**
- `useState` → lokaler UI-State (z.B. Inhalt eines Textfeldes)
- Zustand Store → geteilter State, der mehrere Komponenten betrifft (z.B. Liste der Einträge, Ladezustand)

---

## Wo liegt unser Store?

```
src/features/braindump/store/BrainDumpStore.ts
```

Der Store enthält **State** (die Daten) und **Actions** (Funktionen, die den State verändern) — alles in einem Objekt. Der Aufnahme-Teil ist als eigener Slice ausgelagert (`recordingSliceStore.ts`) und wird in den Haupt-Store gemischt.

---

## Store lesen und benutzen

### Der Hook

```typescript
import { useBrainDumpStore } from '../store';
```

Man übergibt eine **Selector-Funktion**, die genau das aus dem Store herausholt, was die Komponente braucht:

```typescript
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

## Aktueller State & Actions

| Name | Typ | Bedeutung |
| :--- | :--- | :--- |
| `entries` | `BrainDumpEntry[]` | Liste aller Einträge im Dashboard |
| `isRecording` | `boolean` | Ist die Sprachaufnahme gerade aktiv? |
| `isProcessing` | `boolean` | Wird ein Eintrag gerade von der KI verarbeitet? |
| `setRecording(bool)` | Action | Setzt `isRecording` auf true/false |
| `setProcessing(bool)` | Action | Setzt `isProcessing` auf true/false |
| `submitText(text)` | Action (async) | Schickt den Text an die Edge Function, speichert das strukturierte Ergebnis in der DB und lädt die Liste neu. Steuert dabei `isProcessing`. |
| `deleteEntry(id)` | Action (async) → `Promise<DeleteResult>` | Löscht einen Eintrag per UUID. Gibt eine diskriminierte Union zurück: `{ status: 'deleted' \| 'not_found' \| 'error' }`. Lädt die Einträge nur bei `deleted` neu. |
| `updateEntryList()` | Action (async) | Lädt alle Einträge frisch aus der DB in `entries` |

---

## Beispiele

### State lesen

```typescript
export const EntryCounter = () => {
  const entries = useBrainDumpStore((state) => state.entries);

  return <p>{entries.length} Einträge</p>;
};
```

### Action aufrufen

```typescript
export const LoadingIndicator = () => {
  const isProcessing = useBrainDumpStore((state) => state.isProcessing);

  if (!isProcessing) return null;
  return <p>KI analysiert...</p>;
};
```

### Async-Action aufrufen (submitText)

```typescript
export const QuickSubmit = () => {
  const submitText = useBrainDumpStore((state) => state.submitText);

  // submitText kümmert sich selbst um isProcessing (Spinner an/aus).
  // Die Komponente muss nichts await-en, kann es aber, wenn sie auf das Ende reagieren will.
  return <button onClick={() => submitText('Brot kaufen')}>Senden</button>;
};
```

### Mehreres auf einmal (wenn eng zusammengehörig)

```typescript
export const RecordButton = () => {
  const isRecording = useBrainDumpStore((state) => state.isRecording);
  const setRecording = useBrainDumpStore((state) => state.setRecording);

  return (
    <button onClick={() => setRecording(!isRecording)}>
      {isRecording ? 'Stopp' : 'Aufnahme starten'}
    </button>
  );
};
```

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

---

## Wie `set` funktioniert

```typescript
// Variante 1 — einfache Überschreibung:
set(() => ({ isProcessing: true }));

// Variante 2 — basierend auf dem aktuellen State:
set((state) => ({ entries: [newEntry, ...state.entries] }));
```

Variante 2 braucht man immer dann, wenn der neue Wert vom alten abhängt (z.B. ein Element zur Liste hinzufügen).

---

## Schreibweise im Store: `set` benennen

Der Store wird über `create(...)` aufgebaut. Die Factory bekommt drei Argumente
mit — wir benennen sie explizit, damit der Code lesbar bleibt:

```typescript
export const useBrainDumpStore = create<BrainDumpState>()((set) => ({
  setProcessing: (status) => { set(() => ({ isProcessing: status })); },
  // ...
}));
```

- `set` → State ändern (brauchst du fast immer)
- `get` → aktuellen State lesen (z.B. in async-Actions)
- `store` → selten gebraucht, v.a. zum Durchreichen an Slices