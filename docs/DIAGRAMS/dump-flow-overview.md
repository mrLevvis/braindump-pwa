# Dump-Flows — Übersicht aller Fälle

Entscheidungsbaum vom Eintippen/Einsprechen eines Dumps bis zum finalen DB-Write.
Technische Details der einzelnen Flows → jeweilige `dump-flow-*.md`-Dateien.

```mermaid
flowchart TD
    START([Dump Eingabe]) --> INPUT_TYPE{Eingabe-Typ?}

    INPUT_TYPE -- Text --> PROCESS[processText]
    INPUT_TYPE -- Audio --> TRANSCRIBE["transcribeAudio\n(Whisper)"]
    TRANSCRIBE -- Text --> PROCESS

    PROCESS --> LLM_RESULT{Was gibt der LLM zurück?}

    LLM_RESULT -- "1 Entry\n(TASK / EVENT / NOTE)" --> CASE_A["Fall A\n→ dump-flow-a.md"]
    LLM_RESULT -- "Mehrere Entries" --> CASE_B["Fall B\n→ dump-flow-b.md"]
    LLM_RESULT -- "SHOPPING-Entry\n+ Items" --> CASE_C["Fall C\n→ dump-flow-c.md"]
    LLM_RESULT -- "Zusatzinfo zu\nbestehendem Entry" --> CASE_D["Fall D\n→ dump-flow-d.md"]
    LLM_RESULT -- "Mix: neue Entries\n+ Zusatzinfos" --> CASE_MIX["Fall D (Sonderfall)\nMix aus B + D"]

    CASE_A & CASE_B & CASE_C & CASE_D & CASE_MIX --> PREVIEW["IngestPreviewSheet\n(pendingPreview: IngestPreview)"]

    PREVIEW --> USER_ACTION{User-Aktion?}

    USER_ACTION -- "Direkt bestätigen" --> CONFIRM["confirmIngest\n→ DB-Write"]
    USER_ACTION -- "Felder bearbeiten\ndann bestätigen" --> EDIT["EntryEditForm\nim Preview"]
    EDIT --> CONFIRM
    USER_ACTION -- "Verwerfen" --> DISCARD["discardIngest\nkein DB-Write"]

    CONFIRM --> UPDATED_DASHBOARD([Dashboard aktualisiert])
    UPDATED_DASHBOARD --> CLOSE([IngestPreviewSheet geschlossen])
    DISCARD --> CLOSE
```

## Referenzen

| Name im Diagramm | Funktion / Datei | Pfad |
| :--- | :--- | :--- |
| `transcribeAudio` | Audio → Text via Whisper | `src/features/braindump/services/processBrainDump.ts` |
| `processText` | Text an Edge Function schicken | `src/features/braindump/services/processBrainDump.ts` |
| `IngestPreviewSheet` | Bottom Sheet mit Entwurfs-Karten | `src/features/braindump/views/IngestPreviewSheet.tsx` |
| `EntryEditForm` | Bearbeitungsformular im Preview | `src/features/braindump/views/EntryEditForm.tsx` |
| `confirmIngest` | Store-Action: Entwürfe in DB schreiben | `src/features/braindump/store/BrainDumpStore.ts` |
| `discardIngest` | Store-Action: Preview verwerfen | `src/features/braindump/store/BrainDumpStore.ts` |
