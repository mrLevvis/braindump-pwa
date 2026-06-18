# Termin-Serien (Recurrence-System)

Wiederkehrende Termine funktionieren nach dem **Master + Exceptions**-Muster — dasselbe Modell, das auch Google Calendar und RFC 5545 (iCal) verwenden. In der DB liegt nur ein einziger Master-Eintrag; alle einzelnen Vorkommnisse (Occurrences) werden **client-seitig** berechnet.

## Datenmodell

```mermaid
erDiagram
    braindump_entries {
        uuid id PK
        text title
        text category
        jsonb payload
        jsonb recurrence "RecurrenceRule | null"
        boolean is_series_master
        uuid series_master_id FK "null wenn kein Override"
    }

    recurrence_exceptions {
        uuid id PK
        uuid series_entry_id FK "→ braindump_entries (Master)"
        date original_date "Das Datum der betroffenen Occurrence"
        text type "deleted | modified"
        uuid override_entry_id FK "→ braindump_entries (Override), nur bei modified"
    }

    braindump_entries ||--o{ recurrence_exceptions : "hat Ausnahmen"
    recurrence_exceptions ||--o| braindump_entries : "zeigt auf Override"
```

### RecurrenceRule (TypeScript)

```typescript
type RecurrenceFreq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
type Weekday = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';

interface RecurrenceRule {
  freq: RecurrenceFreq;
  interval: number;            // z.B. 2 = "alle 2 Wochen"
  byDay?: Weekday[];           // nur WEEKLY: welche Wochentage
  byMonthPos?: {               // nur MONTHLY: z.B. "letzter Montag"
    ordinal: 1 | 2 | 3 | 4 | -1;
    day: Weekday;
  };
  end:
    | { type: 'forever' }
    | { type: 'until'; date: string }   // YYYY-MM-DD
    | { type: 'count'; count: number };
}
```

## Expansion (Client-seitig)

```mermaid
flowchart LR
    subgraph DB["Datenbank"]
        M[("Master-Entry\n+ RecurrenceRule")]
        E[("recurrence_exceptions\ndeleted / modified")]
        O[("Override-Entries\nbei modified")]
    end

    subgraph Fn["expandRecurringSeries()"]
        direction TB
        ITER["Iteriert tagesweise\nim Sichtfenster"]
        MATCH["matchesRule()\nprüft DAILY/WEEKLY/MONTHLY/YEARLY"]
        DEL["gelöschte Dates\nüberspringen"]
        MOD["modifizierte Dates\n→ Override-Entry einsetzen"]
        VIRT["virtuelle Occurrence erzeugen\nid: masterId__YYYY-MM-DD\n_isVirtualOccurrence: true"]
    end

    subgraph Views["Darstellung"]
        TL["TimelineView"]
        DASH["EntryList / Dashboard"]
    end

    M --> ITER
    E --> DEL & MOD
    O --> MOD
    ITER --> MATCH --> DEL --> VIRT
    MATCH --> MOD --> VIRT
    VIRT --> TL & DASH
```

**Wichtig:** Virtuelle Occurrences haben keine echte UUID. Ihre ID (`masterId__2026-06-18`) ist niemals in der DB — sie existiert nur im lokalen State. Das bedeutet: Wird eine Occurrence bearbeitet oder gelöscht, muss immer über den **RecurrenceScopeDialog** entschieden werden, was in der DB geändert wird.

## Bearbeiten / Löschen einer Occurrence

```mermaid
flowchart TD
    User([User klickt auf eine Occurrence]) --> DLG

    DLG["RecurrenceScopeDialog\nWelche Termine betroffen?"]

    DLG --> S1["'Nur dieser Termin'"]
    DLG --> S2["'Dieser und alle folgenden'"]
    DLG --> S3["'Alle Termine der Serie'"]

    S1 -- Löschen --> A1["exception: { type: 'deleted', original_date }"]
    S1 -- Bearbeiten --> B1["Override-Entry in DB anlegen\nexception: { type: 'modified', override_entry_id }"]

    S2 -- Löschen/Bearbeiten --> C1["Master-Ende setzen (until: gestern)\nNeuen Master ab diesem Datum anlegen"]

    S3 -- Löschen --> D1["Master-Entry löschen\nAlle Exceptions kaskadieren automatisch"]
    S3 -- Bearbeiten --> D2["Master-Entry direkt patchen\nVirtuelle Occurrences neu berechnet"]

    A1 --> DB[("recurrence_exceptions")]
    B1 --> DB
    C1 --> DB2[("braindump_entries")]
    D1 --> DB2
    D2 --> DB2
```

## Schlüsseldateien

| Datei | Rolle |
| :--- | :--- |
| `src/features/timeline/expandRecurringSeries.ts` | Reine Funktion: Master + Exceptions → virtuelle Occurrences |
| `src/features/timeline/recurrenceUtils.ts` | `defaultRecurrenceRule()`, `formatRecurrenceShort()` u.a. Helpers |
| `src/features/braindump/views/RecurrencePickerSection.tsx` | UI: Frequenz, Interval, Wochentage, Ende konfigurieren |
| `src/features/braindump/views/RecurrenceScopeDialog.tsx` | UI: Scope-Auswahl beim Bearbeiten/Löschen einer Occurrence |
| `src/features/braindump/types/index.ts` | `RecurrenceRule`, `RecurrenceException`, `RecurrenceScope` Typen |
