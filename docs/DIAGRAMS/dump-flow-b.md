# Dump-Flow B — Text → mehrere Entries → Confirm

Eingabe, KI-Verarbeitung und confirm/discard-Ende sind identisch mit [Flow A](dump-flow-a.md).
Abweichungen beginnen bei der EdgeFn-Antwort: Groq gibt N `StructuredEntry`s zurück statt einem.

**Was hier neu ist gegenüber Flow A:**
- `IngestResult.entries` enthält N `StructuredEntry`s — alle unter derselben `captureId`
- `IngestPreviewSheet` zeigt N `EntryDraft`s, die der User einzeln bearbeiten oder löschen kann
- `insertEntries` schreibt alle verbleibenden `EntryDraft`s als Batch (kein N-maliges Einzelschreiben)

```mermaid
sequenceDiagram
    actor User
    participant App as App (Store)
    participant EdgeFn as Edge Function
    participant Groq

    Note over User,Groq: Eingabe → submitText → processText → structureText: identisch mit Flow A

    Groq-->>EdgeFn: { entries: [StructuredEntry, ...StructuredEntry] }
    EdgeFn-->>App: IngestResult { captureId, entries: StructuredEntry[] }
    App->>App: pendingPreview = { captureId, drafts: EntryDraft[] }
    App-->>User: IngestPreviewSheet anzeigen (drafts: EntryDraft[])

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

    Note over User,Groq: confirmIngest / discardIngest: identisch mit Flow A
```

**Hinweis:** Wenn nach dem Löschen `pendingPreview.drafts` leer ist, entspricht
ein anschließendes `confirmIngest` einem No-Op (kein DB-Write).

## Referenzen

| Name im Diagramm | Funktion / Datei | Pfad |
| :--- | :--- | :--- |
| `IngestPreviewSheet` | Bottom Sheet mit `EntryDraft[]` | `src/features/braindump/views/IngestPreviewSheet.tsx` |
| `EntryEditForm` | Bearbeitungsformular pro `EntryDraft` | `src/features/braindump/views/EntryEditForm.tsx` |
| `insertEntries` | Batch-DB-Insert aller verbleibenden `EntryDraft`s | `src/features/braindump/services/index.ts` |
