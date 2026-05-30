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

Der Store enthält **State** (die Daten) und **Actions** (Funktionen, die den State verändern) — alles in einem Objekt.

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
| `addDummyEntry(text)` | Action | Fügt einen lokalen Test-Eintrag hinzu (kein KI-Aufruf) |

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
