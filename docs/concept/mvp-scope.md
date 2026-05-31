Wir müssen messerscharf eingrenzen, was die Anwendung können soll.
Was ist die absolute Minimal-Version der App, die deinen Alltag bereits messbar erleichtert?
Wir streichen gnadenlos alles raus, was nur "nice to have" ist (z. B. aufwendige Animationen, Multi-Device-Syncing oder komplexe Filter).

```
Wir fokussieren uns nur auf den Kernprozess.
```

---

# Finales MVP

## Primäre User Story

- "Als Nutzer möchte ich meinen unstrukturierten Gedankenstrom in ein einziges Eingabefeld abladen können (Text/Sprache), damit die KI diesen automatisch in fest definierte Kategorien (Aufgabe, Termin, Notiz) übersetzt und strukturiert in meiner Datenbank ablegt, ohne dass ich mich um die Formatierung kümmern muss."

## Happy Path

### Pfad A: Voice Input

| **SCHRITT**      | **USER AKTION**                | **UI / FEEDBACK**                                                     |
| :--------------- | :----------------------------- | :-------------------------------------------------------------------- |
| **1. EINSTIEG**  | Öffnet die PWA.                | Minimalistisches Dashboard mit dominantem Aufnahme-Button.            |
| **2. START**     | Tippt auf den Aufnahme-Button. | Visuelles Feedback (pulsierender Kreis) signalisiert aktive Aufnahme. |
| **3. INPUT**     | Spricht Gedanken flüssig ein.  | Audio wird im Hintergrund erfasst.                                    |
| **4. ABSCHLUSS** | Tippt erneut auf den Button.   | Pulsieren stoppt, Lade-Spinner ("KI analysiert") erscheint.           |
| **5. ERGEBNIS**  | Wartet.                        | Spinner verschwindet, strukturierter Eintrag ploppt in der Liste auf. |

### Pfad B: Text Input

| **SCHRITT**      | **USER AKTION**                      | **UI / FEEDBACK**                                                       |
| :--------------- | :----------------------------------- | :---------------------------------------------------------------------- |
| **1. EINSTIEG**  | Öffnet die PWA.                      | Dashboard zeigt schlichtes Texteingabefeld über dem Aufnahme-Button.    |
| **2. INPUT**     | Tippt unstrukturierten Gedanken ein. | Text wird im Eingabefeld angezeigt.                                     |
| **3. ABSCHLUSS** | Drückt `Enter` oder "Senden"-Icon.   | Textfeld leert sich, Lade-Spinner ("KI analysiert") erscheint.          |
| **4. ERGEBNIS**  | Wartet.                              | Spinner verschwindet, exakt gleicher strukturierter Eintrag ploppt auf. |

## KI-Input-Output-Vertrag

Die Kommunikation mit dem KI-Anbieter folgt einem strikten Vertrag (Contract). Die KI darf niemals Freitext antworten, sondern muss ein typsicheres JSON-Objekt zurückliefern, das direkt in die Supabase-Datenbank geschrieben werden kann.

Der Anbieter ist über eine Edge Function (sicheres BFF) gekapselt und dadurch austauschbar. Für die MVP-Version nutzen wir **Groq** (kostenloser Free-Tier, OpenAI-kompatibel): Whisper für die Transkription, ein Llama-Modell für die Strukturierung. Der API-Key liegt ausschließlich in den Supabase Secrets und verlässt nie die Cloud.

### Ablauf (Pipeline)

1. **Audio-Input:** Browser-Aufnahme → Whisper (`/audio/transcriptions`) → reiner Text.
2. **Text-Input:** überspringt Schritt 1 und geht direkt weiter.
3. **Strukturierung:** reiner Text → Llama (JSON-Mode) → JSON-Objekt.
4. **Validierung:** Die Edge Function prüft das JSON gegen den Vertrag, *bevor* es zurückgeht. (JSON-Mode garantiert gültiges JSON, aber nicht unsere Felder.)

### 1. Input (Was die KI bekommt)

- **System-Prompt:** Eine unveränderliche Anweisung, die das JSON-Ausgabeformat und die Evaluierungsregeln strikt vorschreibt.
- **User-Payload:** Der Rohtext des Nutzers (Tastatur-Eingabe oder Whisper-Transkript).

### 2. Die 3 Kern-Kategorien (Das strikte Enum)

| Kategorie | Kriterium                                                                          | Beispiel-Input                                                       |
| :-------- | :--------------------------------------------------------------------------------- | :------------------------------------------------------------------- |
| **TASK**  | Eine konkrete Aufgabe, die erledigt/abgehakt werden muss (inkl. Einkäufe, To-Dos). | _"Ich muss morgen Brot kaufen."_ oder _"Projekt-Doku fertigstellen"_ |
| **EVENT** | Ein Termin mit einem spezifischen Zeitbezug.                                       | _"Meeting mit dem KI-Team am Freitag um 14 Uhr."_                    |
| **NOTE**  | Allgemeine Gedanken, Ideen oder Infos ohne direkten Handlungsbedarf.               | _"Clean Code bedeutet nicht, abstrakten Code zu schreiben."_         |

### 3. Output (Der TypeScript-Vertrag)

Spezifische Kontexte (wie Einkäufe) werden flexibel über das `tags`-Array abgebildet, um das Haupt-Enum schlank zu halten (KISS-Prinzip). Dieser Typ lebt geteilt unter `supabase/functions/_shared/contract.ts`.

```typescript
interface StructuredEntry {
  category: "TASK" | "EVENT" | "NOTE";
  title: string; // Kurz zusammengefasster Titel (max. 5 Wörter)
  payload: {
    date?: string; // ISO-Datum (YYYY-MM-DD), falls im Text impliziert
    time?: string; // Uhrzeit (HH:MM), falls im Text erwähnt
    tags?: string[]; // Flexibler Kontext (z.B. ["Einkauf"], ["Arbeit"], ["Privat"])
  };
}
```

## Rote Linie

Um Feature Creep zu verhindern und den Fokus auf die Kernfunktionalität (Chaos rein -> Strukturierte Daten in Supabase raus) zu behalten, werden folgende Funktionen für die Version 1.0 explizit **NICHT** umgesetzt:

> [!CAUTION]
> | AUSGESCHLOSSENES FEATURE | WARUM (Begründung & Overhead) |
> | :--- | :--- |
> | **User-Accounts & Login (Auth)** | Verursacht massiven Overhead im UI (Registrierung, Passwort-Reset). Die PWA läuft vorerst als reine Single-User-Anwendung. |
> | **Kalender-Synchronisation** | Erfordert komplexe OAuth-Flows und API-Fehlerbehandlung. Termine verbleiben vorerst isoliert im PWA-Dashboard. |
> | **Push-Benachrichtigungen** | Zuverlässige Benachrichtigungen erfordern komplexe Service-Worker-Logik und Browser-Permissions. |
> | **Nachträgliches Editieren** | Erfordert UI-Modals und aufwendiges State-Management (Laden, Speichern, Fehler). Im MVP gilt: Nur Erstellen und Lesen (Löschen optional). |
> | **Komplexe Filter & Suche** | Reines "Nice-to-have". Eine einfache chronologische Liste reicht zur MVP-Validierung völlig aus. |
