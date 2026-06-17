# MVP Scope & KI-Vertrag

---

## Primäre User Story

> "Als Nutzer möchte ich meinen unstrukturierten Gedankenstrom in ein einziges Eingabefeld abladen können (Text/Sprache), damit die KI diesen automatisch in fest definierte Kategorien (Aufgabe, Termin, Notiz) übersetzt und strukturiert in meiner Datenbank ablegt, ohne dass ich mich um die Formatierung kümmern muss."

---

## Happy Path

### Pfad A: Voice Input

| **SCHRITT**      | **USER AKTION**                | **UI / FEEDBACK**                                                         |
| :--------------- | :----------------------------- | :------------------------------------------------------------------------ |
| **1. EINSTIEG**  | Öffnet die PWA, ist eingeloggt. | Dashboard mit Eintrags-Liste und fixierter Input-Leiste.                  |
| **2. START**     | Tippt auf den Aufnahme-Button. | Visuelles Feedback (pulsierender Kreis) signalisiert aktive Aufnahme.     |
| **3. INPUT**     | Spricht Gedanken flüssig ein.  | Audio wird im Hintergrund erfasst.                                        |
| **4. ABSCHLUSS** | Tippt erneut auf den Button.   | Transkription läuft, Text erscheint im Eingabefeld.                       |
| **5. ERGEBNIS**  | Drückt Senden.                 | KI analysiert → Ingest-Preview öffnet sich zum Review.                    |
| **6. BESTÄTIGEN**| Prüft Preview, bestätigt.      | Einträge landen in der DB und erscheinen im Dashboard.                    |

### Pfad B: Text Input

| **SCHRITT**      | **USER AKTION**                      | **UI / FEEDBACK**                                                   |
| :--------------- | :----------------------------------- | :------------------------------------------------------------------ |
| **1. EINSTIEG**  | Öffnet die PWA, ist eingeloggt.      | Dashboard zeigt schlichtes Texteingabefeld über dem Aufnahme-Button. |
| **2. INPUT**     | Tippt unstrukturierten Gedanken ein. | Text wird im Eingabefeld angezeigt.                                 |
| **3. ABSCHLUSS** | Drückt `Enter` oder Senden-Icon.     | Spinner erscheint, KI analysiert.                                   |
| **4. REVIEW**    | Prüft den Ingest-Preview.            | Strukturierte Einträge werden vor dem Speichern angezeigt.          |
| **5. ERGEBNIS**  | Bestätigt oder verwirft.             | Bei Bestätigung: Einträge in DB; bei Verwerfen: nichts gespeichert. |

---

## KI-Input-Output-Vertrag

Die Kommunikation mit dem KI-Anbieter folgt einem strikten Vertrag. Die KI darf niemals Freitext antworten, sondern muss ein typsicheres JSON-Objekt zurückliefern.

Der Anbieter ist über eine Edge Function (sicheres BFF) gekapselt und dadurch austauschbar. Wir nutzen **Groq** (Free-Tier, OpenAI-kompatibel): Whisper für die Transkription, ein Llama-Modell für die Strukturierung. Der API-Key liegt ausschließlich in den Supabase Secrets.

### Ablauf (Pipeline)

1. **Audio-Input:** Browser-Aufnahme → Whisper (`/audio/transcriptions`) → reiner Text → Eingabefeld.
2. **Text-Input:** überspringt Schritt 1 und geht direkt weiter.
3. **Strukturierung:** reiner Text → Llama (JSON-Mode) → JSON-Array.
4. **Validierung:** Die Edge Function prüft jeden Entry gegen den Vertrag.
5. **Preview:** Frontend zeigt Entwürfe; User bestätigt oder wirft sie weg.
6. **Persist:** `confirmIngest` schreibt alle Drafts in die DB.

### Die 4 Kategorien

| Kategorie | Kriterium | Beispiel |
| :-------- | :--------- | :------- |
| **TASK** | Konkrete Aufgabe, die abgehakt werden muss. | *"Projekt-Doku fertigstellen"* |
| **EVENT** | Termin mit spezifischem Zeitbezug. | *"Meeting Freitag 14 Uhr"* |
| **NOTE** | Allgemeine Gedanken ohne direkten Handlungsbedarf. | *"Clean Code ≠ abstrakter Code"* |
| **SHOPPING** | Einkaufsartikel — werden automatisch als Items extrahiert. | *"Brot, Milch und Käse kaufen"* |

### TypeScript-Vertrag (Frontend-Seite)

```typescript
// src/features/braindump/types/BrainDump.ts

interface StructuredEntry {
  category: 'TASK' | 'EVENT' | 'NOTE' | 'SHOPPING';
  title: string;
  sourceExcerpt: string;       // Relevanter Wortlaut aus dem Original-Text
  summary: string[];           // Stichpunkte (mind. 1)
  payload: {
    date?: string;             // ISO-Datum (YYYY-MM-DD)
    startTime?: string;        // HH:MM
    endTime?: string;          // HH:MM, nur wenn > startTime
    tags?: string[];           // Flexibler Kontext (z.B. ["Arbeit"])
    items?: string[];          // SHOPPING: einzelne Artikel
  };
}

// Edge-Function-Antwort:
interface IngestResult {
  captureId: string;           // UUID für alle Entries dieses Dumps
  entries: StructuredEntry[];
}
```

Der geteilte Typ lebt in `supabase/functions/_shared/contract.ts`.

---

## Feature-Status

| Feature | Status | Anmerkung |
| :--- | :--- | :--- |
| Text-Input | ✅ Implementiert | |
| Voice-Input (Whisper) | ✅ Implementiert | |
| Ingest-Preview (Review-Sheet) | ✅ Implementiert | |
| Supabase Auth (Magic Link) | ✅ Implementiert | Ursprünglich für v1 ausgeschlossen |
| Einträge löschen | ✅ Implementiert | |
| Einträge bearbeiten | ✅ Implementiert | Ursprünglich für v1 ausgeschlossen |
| Aufgaben abhaken (completed) | ✅ Implementiert | |
| Kategorie-Filter | ✅ Implementiert | Ursprünglich für v1 ausgeschlossen |
| KI-Priorisierung (ephemer) | ✅ Implementiert | |
| Timeline-Ansicht | ✅ Implementiert | |
| Shopping-Feature | ✅ Implementiert | |
| Feedback/Issues-System | ✅ Implementiert | |
| Admin-View | ✅ Implementiert | |
| Kalender-Synchronisation | ❌ Nicht geplant | OAuth-Overhead zu hoch |
| Push-Benachrichtigungen | ❌ Nicht geplant | Service-Worker-Komplexität |
