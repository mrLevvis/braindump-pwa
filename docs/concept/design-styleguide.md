# UI Styleguide

## Ziel
Dieser Styleguide definiert die visuelle und interaktive Sprache fuer die Braindump-PWA.

Leitidee:
- 80% Neo-Glass Productivity fuer Struktur, Lesbarkeit und Fokus.
- 20% Liquid-Glass fuer gezielte Highlights mit Wow-Effekt.

## Designprinzipien
- Produktivitaet vor Dekoration: Inhalte bleiben immer klar lesbar.
- Konsistenz vor Vielfalt: gleiche Rolle = gleiches Pattern.
- Akzente sind selten: Liquid-Effekte nur an wichtigen Aktionen.
- Mobile First: alle Komponenten funktionieren auf kleinen Bildschirmen.
- Performance bewusst: Blur, Schatten und Animationen sparsam einsetzen.

## Farbpalette
### Basis (Dark Ocean)
- `--bg-0`: #06152B (App Hintergrund)
- `--bg-1`: #0C2246 (Surface Basis)
- `--bg-2`: #12315F (Tiefe / Gradient-Ende)

### Text
- `--text-0`: #EAF2FF (primaerer Text)
- `--text-1`: #A8BDD9 (sekundaerer Text)

### Akzent
- `--accent-0`: #39C8FF (Primary CTA / Active)
- `--accent-1`: #7BE3FF (Hover / Glow)

### Status
- `--ok`: #34D399 (Success)
- `--warn`: #F59E0B (Warning)
- `--err`: #F87171 (Error)

## Gradients und Hintergrund
Empfohlener App-Hintergrund:
- linear-gradient(145deg, var(--bg-0) 0%, var(--bg-1) 46%, var(--bg-2) 100%)

Zusaetzlich erlaubt:
- 1-2 radiale Lichtfelder als Atmosphaere.
- Dezentes Raster-Overlay mit sehr niedriger Opazitaet.

## Typografie
- Primare Schrift: Plus Jakarta Sans
- Fallback: Segoe UI, sans-serif

Rollen:
- H1 (Screen Title): 18-22px, semibold, leichtes Tracking
- H2 (Section Title): 14-16px, semibold
- Body: 14-16px, regular
- Meta/Hint: 12-13px, medium

Regeln:
- Keine langen Texte in ALL CAPS.
- Zeilenlaenge in Cards kurz halten.
- Kontrast fuer Fliesstext immer auf `--text-0` oder klar equivalent.

## Radius, Schatten, Blur
- Radius:
  - Card/Panel: 18px
  - Input: 14px
  - Pill/Record-Button: 999px

- Schatten:
  - Tief: 0 18px 42px rgba(2, 8, 23, 0.34)
  - Soft: 0 10px 24px rgba(2, 8, 23, 0.22)

- Blur:
  - Neo-Glass Flaechen: 12-16px
  - Liquid-Glass Highlights: 16-20px

## Komponentenstil
### App-Hintergrund
- Dunkler Verlauf mit kuehlen cyan/tuerkis Lichtinseln.
- Keine harten Farbwechsel.

### Header (sticky)
- Neo-Glass Panel
- Klare Zentrierung des Titels
- Kein Liquid-Effekt im Header

### Entry Cards
- Neo-Glass oder Neo-Glass Soft
- Gut lesbare Text-Hierarchie
- Status/Category nur als kleine Akzentmarker

### Input Dock (unten fixiert)
- Neo-Glass als Basisflaeche
- Input-Feld mit hoher Lesbarkeit und klarer Fokuskante

### Voice Record Button
- Primaeres Liquid-Element
- Darf Pulse/Glow im Recording-State nutzen
- Muss auch ohne Animation erkennbar sein

## Motion und Mikrointeraktion
Erlaubt:
- Kurze Enter-Animationen (250-380ms)
- Subtile Hover/Focus Uebergaenge (120-180ms)
- Recording Pulse nur waehrend aktiver Aufnahme

Vermeiden:
- Daueranimationen auf mehreren Elementen gleichzeitig
- Grosse Bewegung auf Listeninhalten
- Springende Layouts bei Statuswechseln

## Neo/Liquid-Verhaeltnis
- 80% Neo-Glass (Cards, Header, Input-Flaechen)
- 20% Liquid-Glass (Record CTA, aktive Chips, Floating Primary Action)

Harte Regel:
- Gleichzeitig maximal 1-2 sichtbare Liquid-Highlights pro View.

## Accessibility und Qualitaet
- Zielkontrast fuer Texte mindestens WCAG AA.
- Interaktive Elemente mit klar erkennbarem Focus-State.
- Touch Targets mindestens 44x44px.
- Motion optional reduzierbar (`prefers-reduced-motion`).

## Do / Don’t
Do:
- Nutze kuehle, ruhige Farben fuer den Grundton.
- Halte Textflaechen sauber und kontrastreich.
- Setze Liquid nur als visuelle Priorisierung ein.

Don’t:
- Kein Liquid auf grossen Textflaechen.
- Kein Neon-Mix mit vielen konkurrierenden Akzentfarben.
- Keine starke Unschärfe auf leistungsschwachen Mobilgeraeten.

## CSS Token Startpunkt
```css
:root {
  --bg-0: #06152B;
  --bg-1: #0C2246;
  --bg-2: #12315F;

  --text-0: #EAF2FF;
  --text-1: #A8BDD9;

  --accent-0: #39C8FF;
  --accent-1: #7BE3FF;

  --ok: #34D399;
  --warn: #F59E0B;
  --err: #F87171;
}
```

## Komponenten-Mapping fuer dieses Repo
- Header: Neo-Glass
- EntryList + EntryCard: Neo-Glass Soft
- InputSection: Neo-Glass
- VoiceRecordButton: Liquid-Glass (nur bei aktiven States intensiv)

## Abnahme-Checkliste
- Wirkt die UI ruhig und fokussiert?
- Ist Text auf allen Cards klar lesbar?
- Sind Liquid-Elemente selten und bewusst gesetzt?
- Bleibt Scrollen auf Mobile fluessig?
- Ist Recording visuell klar erkennbar?
