# Dump-Flow D (Mix) — neue Entries + Zusatzinfos → IngestPreviewSheet

Scope: EdgeFn-Antwort bis `IngestPreviewSheet` erscheint.
Eingabe und KI-Verarbeitung → [Übersicht](dump-flow-overview.md).
confirm / discard → [Übersicht](dump-flow-overview.md).

Kombination aus [Flow B](dump-flow-b.md) und [Flow D](dump-flow-d.md):
`IngestResult` enthält sowohl neue `StructuredEntry`s als auch `additionalInfos`
zu bestehenden Entries — beides landet in `pendingPreview`.

```mermaid
sequenceDiagram
    participant EdgeFn as Edge Function
    participant App as App (Store)
    actor User

    EdgeFn-->>App: IngestResult { captureId, entries: StructuredEntry[], additionalInfos: EntryAdditionalInfo[] }
    App->>App: entries.map(StructuredEntry → EntryDraft)
    App->>App: pendingPreview = { captureId, drafts: EntryDraft[], additionalInfos: EntryAdditionalInfo[] }
    App-->>User: IngestPreviewSheet
```

**Hinweis:** Im Unterschied zu Flow D (rein) ist `drafts` hier nicht leer —
`IngestPreviewSheet` zeigt neue `EntryDraft`s und die betroffenen bestehenden Entries
gleichzeitig an.

## Referenzen

Keine neuen gegenüber [Flow B](dump-flow-b.md) und [Flow D](dump-flow-d.md).
