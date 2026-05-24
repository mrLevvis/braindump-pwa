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
### Standard Glass (Chrome) — via `<GlassSurface variant="chrome">`
- `background`: `linear-gradient(135deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))`
- `backdrop-filter`: `blur(24px) saturate(180%)`
- `border`: `1px solid rgba(255,255,255,0.38)`
- `border-radius`: 20-28px
- `box-shadow`: `0 16px 64px rgba(0,0,0,0.20), 0 6px 32px rgba(0,0,0,0.10)` + Highlight + Neon-Halo
- Inner Highlight: `inset 0 1px 0 rgba(255,255,255,0.6)`
- Neon-Halo: `0 0 0 1px rgba(255,255,255,0.12), 0 0 24px rgba(255,255,255,0.06)`

Kein CSS-Klassen-Equivalent — immer `<GlassSurface>` verwenden.

### Content Surface (Cards, Input-Panels) — via `.glass-content` CSS-Klasse
- `background`: `rgba(255,255,255,0.07)` — transluzent, Mesh-Blobs scheinen durch
- `backdrop-filter`: `blur(24px) saturate(180%)`
- `border`: `1px solid rgba(255,255,255,0.35)`
- identische Shadow-/Radius-/Highlight-Logik wie Chrome

Wichtig: Die Hintergrundfarbe ist absichtlich sehr transparent. Der `backdrop-filter` macht die eigentliche Arbeit — er verwischt die bunten Mesh-Blobs hinter der Flaeche. Das erzeugt den echten Glas-Look.

## Shadow-Regeln
- Ausschliesslich grosse, diffuse Blur-Radien: **Minimum 32px**, empfohlen 48-80px.
- Kein Shadow-Layer mit Blur unter 32px — erzeugt harte Kanten.
- Opazitaet niedrig halten (0.10-0.22 fuer Dunkel, 0.04-0.06 fuer Weiss-Halo).
- Hover-Schatten: nur Blur und Opacity erhoehen, keine neuen engen Layer hinzufuegen.

Beispiel (korrekt):
```css
box-shadow:
  0 16px 64px rgba(0,0,0,0.18),
  0 6px 32px rgba(0,0,0,0.10),
  inset 0 1px 0 rgba(255,255,255,0.55);
```

## GlassSurface Basiskomponente
Jede Chrome-Glass-Flaeche wird ueber `<GlassSurface>` gebaut — keine eigenen CSS-Klassen.

```tsx
<GlassSurface
  variant="chrome" | "content"  // Pflicht-Prop
  shine="subtle" | "prominent"  // Default: "subtle"
  as="div" | "header" | ...     // Default: "div"
  className="..."
>
  {children}
</GlassSurface>
```

### Reflection-System (drei Ebenen)
1. **Diagonaler Licht-Streak** (`z-index: -1` via Span) — `subtle`: statisch bei ~40% quer, opacity 0.3. `prominent`: Sweep-Animation auf Hover (0.85s).
2. **Top-Edge-Gleam** — `inset 0 1px 0 rgba(255,255,255,0.6)` — der "nasse Meniskus" — immer aktiv.
3. **Corner Sparkles** — nur bei `shine="prominent"` — radiale Weiss-Punkte an zwei diagonalen Ecken, 4s Pulse-Animation.

### shine-Prop Einsatz
- `shine="subtle"`: Standardwert fuer alle Flaechen.
- `shine="prominent"`: Ausschliesslich fuer Hero-Elemente (FAB, aktives Modal, fokussierte Notiz).
- Niemals `prominent` auf Listen-Items.

### Co-located CSS
GlassSurface nutzt `GlassSurface.module.css` fuer Pseudo-Elemente und Keyframes. Neue Komponenten, die Pseudo-Elemente benoetigen, ebenfalls als `.module.css` co-located — kein `@layer` in `index.css`.

## Glossy Reflection
Siehe **GlassSurface Basiskomponente** oben — alle drei Ebenen sind dort implementiert.

Fuer `.glass-content` CSS-Klasse (EntryCards): Shine via `::before` Pseudo-Element, statisch, opacity 0.6.

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
  - Chrome-Ebenen (GlassSurface): `text-shadow: 0 1px 3px rgba(0,0,0,0.45)`
  - Content-Ebenen: `text-shadow: 0 1px 3px rgba(0,0,0,0.45)`

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
- **Pseudo-Elemente und Keyframes**: CSS-Modul (`.module.css`) co-lokal zur Komponente — kein Inline-Style-Objekt, kein `@layer` in `index.css`.
- Jede neue Glass-Komponente composet `<GlassSurface>` — keine eigenen Glass-Styles definieren.
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
- Pro angeforderter Komponente eine `.tsx`-Datei und bei Bedarf eine `.module.css` ausgeben.
- Pseudo-Elemente und Keyframes immer in der `.module.css`, nicht inline.
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

  /* Chrome-Glass via <GlassSurface> — kein direkter Einsatz als CSS-Klasse */
  --glass-bg: linear-gradient(135deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03));
  --glass-border: 1px solid rgba(255,255,255,0.38);
  --glass-shadow: 0 16px 64px rgba(0,0,0,0.20), 0 6px 32px rgba(0,0,0,0.10);
  --glass-highlight: inset 0 1px 0 rgba(255,255,255,0.6);

  /* Content-Surface via .glass-content CSS-Klasse */
  --glass-content-bg: rgba(255,255,255,0.07);

  --ok: #34d399;
  --warn: #f59e0b;
  --err: #f87171;
}
```

## Komponenten-Mapping fuer dieses Repo
- Header: `<GlassSurface variant="chrome" shine="subtle">` (sticky, z-20)
- EntryList + EntryCard: `.glass-content .glass-content-hover` CSS-Klassen
- InputSection-Panel: `<GlassSurface variant="content" shine="subtle">`
- TextInput: Glass-Input mit verpflichtendem Focus-Ring `rgba(124,58,237,0.5)`
- VoiceRecordButton: Primary Gradient-Button (Violet→Magenta) mit Gloss-Highlight via `::before`

## Abnahme-Checkliste
- Ist der Mesh-Hintergrund mit 4 animierten Blobs umgesetzt (blob-drift-1 bis -4)?
- Verwenden alle Chrome-Elemente `<GlassSurface>` statt eigener Glass-CSS?
- Nutzen Content-Elemente `.glass-content` mit `rgba(255,255,255,0.07)`?
- Ist backdrop-filter auf allen Glass-Flaechen aktiv (`blur(24px) saturate(180%)`)?
- Kein Shadow-Layer mit Blur unter 32px im gesamten Codebase?
- Ist Text auf allen Glass-Ebenen klar lesbar (text-shadow aktiv, WCAG AA)?
- Sind Reduced-Motion-Regeln korrekt aktiv (Streak-Sweep, Sparkle-Pulse, Blob-Drift)?
- Wird pro Komponenten-Request `.tsx` + ggf. `.module.css` geliefert?
