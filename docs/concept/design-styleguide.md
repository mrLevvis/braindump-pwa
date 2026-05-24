# UI Styleguide

## Ziel
Dieser Styleguide definiert die visuelle und technische Umsetzung fuer eine moderne, lebendige Liquid-Glass-Aesthetik in der Braindump-PWA.

Leitidee:
- Glossy und nass wirkende Materialien statt matter oder frosted Oberflaechen.
- Hohe Lesbarkeit bleibt nicht verhandelbar, selbst bei starken Farben und Effekten.

## Designprinzipien
- Lesbarkeit vor Effekt: Texte bleiben auf jeder Glass-Ebene eindeutig lesbar.
- Liquid gezielt einsetzen: Glass fuer Chrome, Content auf dunkler, stabiler Surface.
- Composable by default: Komponenten sind modular und wiederverwendbar.
- Mobile First: dieselbe visuelle Sprache auf kleinen und grossen Viewports.
- Motion bewusst: Atmosphaere durch langsame Bewegung, keine visuelle Unruhe.

## Farbpalette
### Vivid Mesh Farben
- `--mesh-violet`: #7C3AED
- `--mesh-magenta`: #EC4899
- `--mesh-cyan`: #06B6D4
- `--mesh-lime`: #A3E635

### Text auf Glass
- `--text-glass-primary`: #FFFFFF
- `--text-glass-secondary`: rgba(255,255,255,0.7)

Regel:
- Niemals graue Texttoene auf Glass-Flaechen verwenden.

## Hintergrund und Atmosphaere
- Nutze einen animierten Mesh-Gradient mit 3-4 grossen radialen Blobs.
- Jeder Blob:
  - starker Blur (`filter: blur(120px)`)
  - Opazitaet zwischen 0.6 und 0.9
  - langsame Drift-Animation mit 40-60s Loop
- Die Blobs bewegen sich subtil und asynchron.

## Liquid-Glass Tokens
### Standard Glass (Chrome)
- `background`: `linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))`
- `backdrop-filter`: `blur(24px) saturate(180%)`
- `border`: `1px solid rgba(255,255,255,0.25)`
- `border-radius`: 20-28px
- `box-shadow`: `0 8px 32px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)`
- Inner Highlight: `inset 0 1px 0 rgba(255,255,255,0.4)`

### Dark Content Surface (lesbar, on-theme)
- `background`: `rgba(20,20,40,0.6)`
- `backdrop-filter`: `blur(24px) saturate(180%)`
- identische Radius-/Border-/Shadow-Logik wie Standard Glass

## Glossy Reflection
- Jede Glass-Card erhaelt einen diagonalen Shine-Layer via `::before`.
- Verlauf von `rgba(255,255,255,0.3)` nach transparent.
- Abdeckung nur im oberen linken Drittel.
- Der Shine-Layer ist verpflichtend fuer den Liquid-Look.

## Hover und Interaktion
- Hover auf Glass-Komponenten:
  - `transform: scale(1.02)`
  - Shine-Layer verschiebt sich leicht
  - Schatten wird tiefer
- Inputs:
  - Glass-Hintergrund verwenden
  - Focus-Ring zwingend: `0 0 0 3px rgba(124,58,237,0.5)`
- Buttons:
  - Primary: solide Gradient-Flaeche (Violet zu Magenta) mit innerem Gloss-Highlight
  - Secondary: Glass-Variante

## Typografie
- Primare Schrift: Inter oder Geist
- Gewichte:
  - Body: 400
  - Headings: 600
- Text auf Glass immer mit Legibility-Shadow:
  - `text-shadow: 0 1px 2px rgba(0,0,0,0.2)`

## Komponentenregeln
- Glass wird nur fuer Chrome eingesetzt:
  - Sidebar
  - Top Bar
  - Modal
  - Floating Buttons
  - Dropdowns
- Content-Container bleiben auf dunkler, stabiler Glass-Surface:
  - Note Cards
  - Input-Felder
  - Listencontainer

## Technische Vorgaben (React + Tailwind)
- Komponenten in TypeScript mit strict typing.
- Ausschliesslich named exports.
- Tailwind Utilities bevorzugen, inklusive Arbitrary Values (z. B. `backdrop-blur-[24px]`).
- Custom CSS fuer Keyframes und Pseudo-Elemente entweder:
  - ko-lokal im Component-File (Styles-Objekt), oder
  - in `@layer`-Blocks.
- Komponenten muessen self-contained und composable sein.

## Accessibility
- WCAG AA (4.5:1) fuer Body-Text ist Pflicht.
- Kontrastpruefung gegen den dunkelsten verwendeten Gradient-Stop dokumentieren.
- Fokuszustaende visuell klar und konsistent.
- Touch-Targets mindestens 44x44px.

## Motion und Reduced Motion
- Bei `prefers-reduced-motion: reduce` gilt:
  - Gradient-Animationen deaktivieren
  - Hover-Transforms deaktivieren
  - nur statische Zustandswechsel verwenden

## Delivery-Regeln fuer Komponenten
- Pro angeforderter Komponente genau eine `.tsx`-Datei ausgeben.
- Styles muessen inline oder ko-lokal enthalten sein.
- Keine externen CSS-Dateien verwenden, ausser explizit angefordert.

## Do / Don’t
Do:
- Nutze die vier Mesh-Farben als klares visuelles System.
- Halte Primary/Secondary Textwerte strikt ein.
- Trenne Chrome-Glass und Content-Surface konsequent.
- Nutze Shine-Layer und Inner Highlights fuer den Liquid-Eindruck.

Don’t:
- Kein mattes/frosted Glass als Standard einsetzen.
- Keine grauen Texte auf Glass-Flaechen.
- Kein permanentes starkes Motion-Noise.
- Keine untypisierten oder default-export Komponenten liefern.

## CSS Token Startpunkt
```css
:root {
  --mesh-violet: #7C3AED;
  --mesh-magenta: #EC4899;
  --mesh-cyan: #06B6D4;
  --mesh-lime: #A3E635;

  --text-glass-primary: #FFFFFF;
  --text-glass-secondary: rgba(255,255,255,0.7);

  --glass-bg: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05));
  --glass-border: 1px solid rgba(255,255,255,0.25);
  --glass-shadow: 0 8px 32px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1);
  --glass-highlight: inset 0 1px 0 rgba(255,255,255,0.4);
  --glass-content-bg: rgba(20,20,40,0.6);
}
```

## Komponenten-Mapping fuer dieses Repo
- Header: Chrome-Glass mit Shine-Layer
- EntryList + EntryCard: Dark Content Surface
- InputSection: Dark Content Surface + fokussierter Input-Glow
- TextInput: Glass-Input mit verpflichtendem Focus-Ring
- VoiceRecordButton: Primary Gradient-Button mit Gloss-Highlight

## Abnahme-Checkliste
- Ist der Mesh-Hintergrund mit 3-4 animierten Blobs umgesetzt?
- Verwenden Chrome-Elemente die Standard-Glass-Tokens?
- Nutzen Content-Elemente konsequent `rgba(20,20,40,0.6)`?
- Ist Text auf allen Glass-Ebenen klar lesbar und WCAG-AA-konform?
- Sind Reduced-Motion-Regeln korrekt aktiv?
- Wird pro Komponenten-Request genau eine `.tsx`-Datei geliefert?
