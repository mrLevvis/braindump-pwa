# UI Styleguide

## Ziel
Dieser Styleguide definiert die visuelle und interaktive Sprache fuer die Braindump-PWA.

Leitidee:
- 70% ruhiges Productivity-Glass fuer Struktur, Lesbarkeit und Fokus.
- 30% Liquid-Glass Finish fuer Tiefe, Lichtreflexe und Priorisierung.

## Designprinzipien
- Produktivitaet vor Dekoration: Inhalte bleiben immer klar lesbar.
- Konsistenz vor Vielfalt: gleiche Rolle = gleiches Pattern.
- Akzente sind selten: Liquid-Effekte nur an wichtigen Aktionen.
- Mobile First: alle Komponenten funktionieren auf kleinen Bildschirmen.
- Performance bewusst: Blur, Schatten und Animationen sparsam einsetzen.
- Borderless by default: keine harten 1px-Rahmen fuer Panels, stattdessen Lichtkanten und Tiefenschatten.

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
  - Tief (Base Token): 0 18px 42px rgba(2, 8, 23, 0.34)
  - Soft (Base Token): 0 10px 24px rgba(2, 8, 23, 0.22)
  - Panel-Shadow (aktuell): 0 22px 46px rgba(2, 8, 23, 0.38) + 0 6px 18px rgba(8, 41, 82, 0.28)
  - Soft-Panel-Shadow (aktuell): 0 14px 30px rgba(2, 8, 23, 0.28) + 0 4px 12px rgba(8, 41, 82, 0.2)

- Blur:
  - Primary Panels: blur(20px) saturate(150%)
  - Secondary Panels: blur(16px) saturate(140%)
  - Liquid CTA: blur(18px)

## Borderless-Glass Regeln
- Keine sichtbaren Standard-Border auf Header-, Input- und Entry-Panels.
- Lesbare Trennung durch Layer statt Rahmen:
  - Inner Highlight: inset 0 1px 0 rgba(255,255,255,0.18-0.24)
  - Inner Edge Glow: inset 0 0 0 1px rgba(185,216,255,0.18)
  - Bottom Depth: inset negative-y Shadow fuer Volumen
- Jede Glass-Flaeche bekommt einen Sheen-Layer (diagonaler Lichtverlauf), aber mit niedriger Opazitaet.

## Komponentenstil
### App-Hintergrund
- Dunkler Verlauf mit kuehlen cyan/tuerkis Lichtinseln.
- Keine harten Farbwechsel.

### Header (sticky)
- Neo-Glass Panel
- Klare Zentrierung des Titels
- Erlaubt: subtiler Liquid-Sheen fuer Materialanmutung
- Verboten: aggressive Glow-Animationen im Header

### Entry Cards
- Glass Soft (borderless)
- Gut lesbare Text-Hierarchie
- Status/Category nur als kleine Akzentmarker
- Hover nur ueber Tiefe (leichtes Lift + Shadow), nicht ueber Rahmenfarbe

### Input Dock (unten fixiert)
- Neo-Glass als Basisflaeche
- Input-Feld borderless mit Inset-Highlight
- Fokus ueber Ring/Glow, nicht ueber Border-Farbwechsel

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
- 70% Productivity-Glass (Cards, Header, Input-Flaechen)
- 30% Liquid-Glass (Record CTA, Reflex-Layer auf Panels, aktive Micro-Akzente)

Harte Regel:
- Gleichzeitig maximal 1-2 sichtbare Liquid-Highlights pro View.
- Panels muessen sich auch ohne Border klar vom Hintergrund abheben.

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
- Nutze Tiefenschatten + Inset-Layer als Trennung von Surface und Background.

Don’t:
- Kein Liquid auf grossen Textflaechen.
- Kein Neon-Mix mit vielen konkurrierenden Akzentfarben.
- Keine starke Unschärfe auf leistungsschwachen Mobilgeraeten.
- Keine Rueckkehr zu harten Panel-Bordern als primaere Trennung.

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
- Header: glass-panel (borderless, strong readability shadow)
- EntryList + EntryCard: glass-panel-soft (borderless)
- InputSection: glass-panel (borderless)
- TextInput: borderless Input + Focus-Ring
- VoiceRecordButton: Liquid-Glass (Recording State intensiv)

## Abnahme-Checkliste
- Wirkt die UI ruhig und fokussiert?
- Ist Text auf allen Cards klar lesbar?
- Sind Liquid-Elemente selten und bewusst gesetzt?
- Bleibt Scrollen auf Mobile fluessig?
- Ist Recording visuell klar erkennbar?
- Heben sich Panels ohne Border eindeutig vom Hintergrund ab?
