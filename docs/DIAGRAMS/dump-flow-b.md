# Dump-Flow B — N StructuredEntrys → IngestPreviewSheet

Groq gibt mehrere `StructuredEntry`s zurück — alle unter derselben `captureId`.
Der User kann `EntryDraft`s im `IngestPreviewSheet` einzeln bearbeiten oder löschen.

Einbettung im [Overview](dump-flow-overview.md): nach `processText`, vor `USER_ACTION`.

**Akteure:**
- **App** — Frontend (BrainDumpStore + React)
- **EdgeFn** — Supabase Edge Function `process-brain-dump`
- **Groq** — LLM (Llama, JSON-Mode)
- **User** — Browser

```mermaid
sequenceDiagram
    participant EdgeFn as Edge Function
    participant App as App (Store)
    actor User

    EdgeFn->>Groq: structureText(text)
    Groq-->>EdgeFn: { entries: [StructuredEntry, ...StructuredEntry] }
    EdgeFn-->>App: IngestResult { captureId, entries: StructuredEntry[] }
    App->>App: pendingPreview = { captureId, drafts: EntryDraft[] }
    App-->>User: IngestPreviewSheet zeigt N EntryDrafts

    opt User bearbeitet einzelne EntryDrafts
        loop Pro EntryDraft
            User->>App: EntryDraft antippen → EntryEditForm öffnen
            User->>App: Felder anpassen + Speichern
            App->>App: EntryDraft in pendingPreview.drafts aktualisieren
        end
    end

    opt User löscht einzelne EntryDrafts
        User->>App: EntryDraft entfernen
        App->>App: EntryDraft aus pendingPreview.drafts entfernen
    end
```

**Hinweis:** `insertEntries` in `confirmIngest` schreibt alle verbleibenden
`EntryDraft`s als Batch — kein N-maliges Einzelschreiben.

## Referenzen

| Name im Diagramm | Funktion / Datei | Pfad |
| :--- | :--- | :--- |
| `EntryEditForm` | Bearbeitungsformular pro `EntryDraft` | `src/features/braindump/views/EntryEditForm.tsx` |
