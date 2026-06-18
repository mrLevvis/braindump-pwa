# Ingest-Pipeline (KI-Verarbeitung)

Der Kern-Flow der App: Unstrukturierter Text oder Sprache wird durch zwei KI-Modelle in typsichere Einträge übersetzt und vom User bestätigt, bevor irgendetwas in der Datenbank landet.

## Vollständiger Ablauf

```mermaid
flowchart TD
    A([User: Text oder Sprache eingeben]) --> B{Input-Typ?}

    B -- Sprache --> C["VoiceRecorderControl\nMediaRecorder (Browser-API)"]
    C --> D["transcribeAudio(blob)\nEdge Fn: Whisper → reiner Text"]
    D --> E[Transkript erscheint\nim Eingabefeld]

    B -- Text --> F[TextInput\nEingabefeld befüllen]
    F --> E

    E --> G["submitText(text)\nBrainDumpStore Action"]
    G --> H["Edge Function: process-brain-dump\n(Supabase — kein API-Key im Browser)"]
    H --> I["Groq: Llama (JSON-Mode)\nText → StructuredEntry[]"]
    I --> J{Validierung\nim Edge-Code}

    J -- Fehler --> L([Error-Toast\nkein State-Update])
    J -- OK --> K["IngestResult\n{ captureId: UUID, entries: StructuredEntry[] }"]

    K --> M["pendingPreview setzen\nBrainDumpStore"]
    M --> N["IngestPreviewSheet (Bottom Sheet)\nUser prüft strukturierte Entwürfe"]

    N -- Entwurf tippen --> O["DraftEditDialog\n→ EntryEditForm\nTitel / Kategorie / Datum / Wiederholung anpassen"]
    O --> N

    N -- Verwerfen --> P(["discardIngest(captureId)\nkein DB-Write — nichts passiert"])
    N -- Speichern --> Q["confirmIngest(preview)\nBrainDumpStore Action"]

    Q --> R["DB-Write: braindump_entries\nSHOPPING-Items → auch shopping_items"]
    R --> S["updateEntryList()\nfrisch aus DB laden"]
    S --> T([Dashboard aktualisiert\nToast: 'Einträge gespeichert'])
```

## Warum eine Edge Function?

Die KI-Calls (Groq) dürfen **nicht** direkt aus dem Browser erfolgen — der API-Key wäre für jeden sichtbar. Die Edge Function (Supabase) ist das sichere Backend-for-Frontend (BFF): Sie hält den Key in Secrets und ist die einzige Stelle, die mit Groq kommuniziert.

```
Browser ──HTTP──▶ Supabase Edge Fn ──HTTPS──▶ Groq API
                         │
                         └──▶ PostgreSQL (DB-Write nach Validierung)
```

## KI-Input-/Output-Vertrag

Die Edge Function akzeptiert entweder `{ text: string }` (JSON) für Text-Input oder `FormData` mit einer Audio-Datei für Voice-Input. Sie antwortet immer mit:

```typescript
interface IngestResult {
  captureId: string;        // UUID — verbindet alle Entries eines Dumps
  entries: StructuredEntry[];
}

interface StructuredEntry {
  category: 'TASK' | 'EVENT' | 'NOTE' | 'SHOPPING';
  title: string;
  sourceExcerpt: string;    // Relevanter Wortlaut aus dem Original
  summary: string[];        // Stichpunkte
  payload: {
    date?: string;          // YYYY-MM-DD
    startTime?: string;     // HH:MM
    endTime?: string;       // HH:MM
    tags?: string[];
    items?: string[];       // Nur SHOPPING: einzelne Artikel
  };
}
```

Der geteilte Vertrag lebt in `supabase/functions/_shared/contract.ts`.

## Schlüsseldateien

| Datei | Rolle |
| :--- | :--- |
| `src/features/braindump/services/processBrainDump.ts` | `processText()` und `transcribeAudio()` — HTTP-Calls zur Edge Fn |
| `src/features/braindump/store/BrainDumpStore.ts` | `submitText`, `confirmIngest`, `discardIngest` — State-Management |
| `src/features/braindump/views/IngestPreviewSheet.tsx` | Bottom Sheet mit Entwurfs-Karten und Bestätigen/Verwerfen |
| `src/features/braindump/views/EntryEditForm.tsx` | Wiederverwendbares Bearbeitungsformular (im Preview und im Detail-Panel) |
| `supabase/functions/process-brain-dump/` | Edge Function: Whisper + Llama, Validierung, DB-Write |
