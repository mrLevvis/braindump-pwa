# Dump-Flows — Übersicht aller Fälle

Entscheidungsbaum vom Eintippen/Einsprechen eines Dumps bis zum finalen DB-Write.
Technische Details der einzelnen Flows → jeweilige `dump-flow-*.md`-Dateien.

```mermaid
flowchart TD
    START([Dump: Text oder Sprache]) --> INPUT_TYPE{Eingabe-Typ?}

    INPUT_TYPE -- Text --> PROCESS[processText]
    INPUT_TYPE -- Audio --> TRANSCRIBE["transcribeAudio\n(Whisper)"]
    TRANSCRIBE --> PROCESS

    PROCESS --> LLM_RESULT{Was gibt der LLM zurück?}

    LLM_RESULT -- "1 Entry\n(TASK / EVENT / NOTE)" --> CASE_A["Fall A\n→ dump-flow-a.md"]
    LLM_RESULT -- "Mehrere Entries" --> CASE_B["Fall B\n→ dump-flow-b.md"]
    LLM_RESULT -- "SHOPPING-Entry\n+ Items" --> CASE_C["Fall C\n→ dump-flow-c.md"]
    LLM_RESULT -- "Zusatzinfo zu\nbestehendem Entry" --> CASE_D["Fall D\n→ dump-flow-d.md"]
    LLM_RESULT -- "Mix: neue Entries\n+ Zusatzinfos" --> CASE_MIX["Fall D (Sonderfall)\nMix aus B + D"]

    CASE_A & CASE_B & CASE_C & CASE_D & CASE_MIX --> PREVIEW["IngestPreviewSheet\nUser prüft strukturierte Entwürfe"]

    PREVIEW --> USER_ACTION{User-Aktion?}

    USER_ACTION -- "Direkt bestätigen" --> CONFIRM["confirmIngest\n→ DB-Write"]
    USER_ACTION -- "Felder bearbeiten\ndann bestätigen" --> EDIT["EntryEditForm\nim Preview"]
    EDIT --> CONFIRM
    USER_ACTION -- "Verwerfen" --> DISCARD["discardIngest\nkein DB-Write"]

    CONFIRM --> DONE([Dashboard aktualisiert])
    DISCARD --> DONE_DISCARD([PreviewSheet geschlossen])
```
