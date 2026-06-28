# Dump-Flow B — Text → mehrere Entries → Confirm

Ein Dump enthält mehrere unabhängige Informationen — der LLM gibt N Entries zurück,
die im Preview als separate Karten erscheinen. User kann jeden Draft einzeln bearbeiten
oder löschen, bevor er bestätigt.

Unterschied zu Flow A: EdgeFn liefert `entries: [Entry1, ..., EntryN]`; `insertEntries`
schreibt alle verbleibenden Drafts in einem Batch; `captureId` verbindet alle N Entries.

**Akteure:**
- **User** — Browser
- **App** — Frontend (BrainDumpStore + React)
- **EdgeFn** — Supabase Edge Function `process-brain-dump`
- **Groq** — LLM (Llama, JSON-Mode)
- **DB** — Supabase PostgreSQL

```mermaid
sequenceDiagram
    actor User
    participant App as App (Store)
    participant EdgeFn as Edge Function
    participant Groq
    participant DB as Supabase DB

    User->>App: Text eintippen + Submit
    App->>App: submitText(text)<br/>setProcessing(true)
    App->>EdgeFn: processText(text, contextEntries)
    EdgeFn->>Groq: structureText(text)
    Groq-->>EdgeFn: { entries: [Entry1, Entry2, ...EntryN] }
    EdgeFn-->>App: IngestResult { captureId, entries: [N Entries] }
    App->>App: pendingPreview setzen<br/>setProcessing(false)
    App-->>User: IngestPreviewSheet anzeigen (N Draft-Karten)

    opt User bearbeitet einzelne Drafts
        loop Pro Draft-Karte
            User->>App: Draft-Karte antippen → EntryEditForm öffnen
            User->>App: Felder anpassen + Speichern
            App->>App: Draft in pendingPreview aktualisieren
        end
    end

    opt User löscht einzelne Drafts
        User->>App: Draft-Karte entfernen
        App->>App: Draft aus pendingPreview entfernen
    end

    alt User bestätigt (verbleibende Drafts)
        User->>App: confirmIngest(preview)
        App->>DB: insertEntries([Entry1, ..., EntryN])
        DB-->>App: OK
        App->>DB: fetchEntries() + fetchRecurrenceExceptions()
        DB-->>App: aktueller Datenstand
        App-->>User: Dashboard aktualisiert + Toast
    else User verwirft alle
        User->>App: discardIngest(captureId)
        App->>App: pendingPreview = null
        App-->>User: PreviewSheet geschlossen (kein DB-Write)
    end
```

**Hinweise:**
- Alle N Entries teilen sich dieselbe `captureId` — sie gehören zum selben Dump.
- `insertEntries` ist ein einzelner Batch-Insert, kein N-maliges Einzelschreiben.
- Wenn der User einzelne Drafts löscht und dann bestätigt, werden nur die
  verbleibenden Drafts in die DB geschrieben.
- Falls nach dem Löschen einzelner Drafts kein Draft mehr übrig ist, entspricht
  das einem vollständigen Verwerfen (kein DB-Write).

## Referenzen

| Name im Diagramm | Funktion / Datei | Pfad |
| :--- | :--- | :--- |
| `submitText` | Store-Action: Text verarbeiten, Preview setzen | `src/features/braindump/store/BrainDumpStore.ts` |
| `processText` | HTTP-Call zur Edge Function | `src/features/braindump/services/processBrainDump.ts` |
| `structureText` | Groq-Aufruf + JSON-Parsing | `supabase/functions/process-brain-dump/structureText.ts` |
| Edge Function | Entry-Verarbeitung via Groq | `supabase/functions/process-brain-dump/index.ts` |
| `IngestPreviewSheet` | Bottom Sheet mit N Draft-Karten | `src/features/braindump/views/IngestPreviewSheet.tsx` |
| `EntryEditForm` | Bearbeitungsformular pro Draft-Karte | `src/features/braindump/views/EntryEditForm.tsx` |
| `confirmIngest` | Store-Action: alle Drafts als Batch in DB schreiben | `src/features/braindump/store/BrainDumpStore.ts` |
| `insertEntries` | Batch-DB-Insert für alle neuen Entries | `src/features/braindump/services/index.ts` |
| `fetchEntries` | Entries nach Save neu laden | `src/features/braindump/services/index.ts` |
| `discardIngest` | Store-Action: Preview verwerfen | `src/features/braindump/store/BrainDumpStore.ts` |
