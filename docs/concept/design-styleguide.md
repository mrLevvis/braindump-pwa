# BrainDump UI Style Guide – Glassmorphismus (MVP-UI-Mockup-2)

## 1. Visuelles Design-Prinzip

Das definierende Prinzip ist moderner **Glassmorphismus** im **Light Mode**. Ziel: Saubere, luftige, beruhigende UI mit klarer Informationshierarchie durch Tiefe und subtile Farbakzente.

**Schlüsselkonzepte:**

- **Frosted Glass (Mattiert):** Karten/Eingabefelder sind mattiert, lichtdurchlässig, Hintergrund wird weichgezeichnet.
- **Polierte Lichtkanten:** Glass-Elemente haben scharfe, helle, polierte Kanten mit Lichtreflexionen.
- **Licht & Reflexion:** Subtile Glanzlichter und Reflexionen an Ecken/Rändern verstärken den Glass-Effekt.

## 2. Farbpalette

### 2.1 Hintergrund

- Sehr heller, kühler Gradient aus blassem Lichtblau und Weiß, mit subtiler, wolkenartiger oder eismarmorierter Textur für Tiefe.

### 2.2 Tönungs-Farbcodes (Glass-Elemente)

Diese Farben werden als transparente Tönungen auf die Frosted-Glass-Flächen gelegt:

- **Task:** Blassblau – `#D1E8FF` oder `#E3F2FD` (niedrige Opazität)
- **Event:** Blassgrün – `#C8E6C9` oder `#E8F5E9`
- **Note:** Blassviolett – `#E1BEE7` oder `#F3E5F5`

### 2.3 Text- & Ikonografie-Farben

- **Haupttext:** Dunkelgrau/Anthrazit `#333333`–`#4A4A4A`
- **Sekundärtext:** Mittelgrau `#666666`–`#757575`
- **Platzhaltertext:** Hellgrau `#888888`
- **Icons:** Dunkelgrau `#333333`

## 3. Typografie

- Moderne, serifenlose Schrift (z.B. Inter, Geist, system-ui)
- **Header Titel:** Groß, fett, dunkelgrau
- **Sektionstitel:** Klein, fett, dunkelgrau, GROSSBUCHSTABEN, Zahl in Klammern
- **Karten-Text:** Normalgröße, leicht–normal, dunkelgrau
- **Zeitstempel:** Klein, leicht, hellgrau
- **Tags:** Sehr klein, fett, dunkelgrau
- **Platzhalter:** Normal, leicht, hellgrau

## 4. Komponenten-Spezifikationen

### 4.1 Header-Pille

- Breites, abgerundetes Glass-Pillen-Rechteck
- Voll poliert, starke Lichtreflexionen an Kanten
- Zentrierter Titel

### 4.2 Kategorie-Pillen (Sektionstitel)

- Kleine, abgerundete Glass-Pillen
- Polierte Kanten, getönt nach Kategorie (blau, grün, violett)
- Optional: Klick zum Reduzieren/Erweitern

### 4.3 Notizen-Karten

- Große, abgerundete Rechtecke (Glass-Pillen)
- Frosted-Glass, passend zur Kategorie getönt
- Polierte, klare Lichtreflexionen an Kanten
- Text links, Zeitstempel oben rechts
- Variante: Zusätzliche kleine, polierte Glass-Pillen-Tags

### 4.4 Notizen-Tags

- Miniatur-Kategorie-Pillen
- Poliert, passend zur Kategorie getönt

### 4.5 Untere Eingabeleiste

- Breites, abgerundetes Glass-Rechteck
- Frosted-Glass, Platzhaltertext weichgezeichnet
- Stark polierte Lichtreflexionen, besonders unten (schwebender, geschliffener Effekt)
- Eingabefeld für Platzhalter
- Mikrofon-Symbol: Separat, kreisförmig, poliert, Lichtkante, rechts vom Textfeld

## 5. Layout & Abstände

- Klare vertikale Stapelung
- Sektionen durch Kategorie-Pillen getrennt
- Gleichmäßige vertikale Abstände zwischen Karten
- Untere Eingabeleiste fixiert
- Großzügige, gleichmäßige Polsterung in Karten

## 6. Sprachanmerkungen & Formate

- Sprache: Deutsch
- Zeitformat: HH:MM (24h)
- Tags: Prägnant, Groß- oder gemischte Schreibweise
- Verständlichkeit: Alle Texte leicht lesbar

## 7. Technische Vorgaben (React + CSS/Tailwind)

- Komponenten in TypeScript, strict typing, nur named exports
- Tailwind-Utilities bevorzugen, inkl. Arbitrary Values (`backdrop-blur-[24px]`)
- Pseudo-Elemente/Keyframes: `.module.css` co-located zur Komponente
- Glass-Komponenten immer als eigene Komponente (z.B. `<GlassSurface>`, `<GlassPill>`, `<GlassCard>`, `<GlassInput>`)
- Keine eigenen Glass-Styles in anderen Komponenten
- Komponenten müssen self-contained und composable sein

## 8. CSS Token Startpunkt

```css
:root {
  /* Hintergrund */
  --background-gradient: linear-gradient(120deg, #fafdff 0%, #e3f2fd 100%);

  /* Glass-Tönungen */
  --glass-task: rgba(209, 232, 255, 0.75); /* #D1E8FF */
  --glass-event: rgba(200, 230, 201, 0.75); /* #C8E6C9 */
  --glass-note: rgba(225, 190, 231, 0.75); /* #E1BEE7 */

  /* Glass-Base */
  --glass-bg: rgba(255, 255, 255, 0.45);
  --glass-blur: blur(24px);
  --glass-border: 1.5px solid rgba(255, 255, 255, 0.55);
  --glass-radius: 24px;
  --glass-shadow:
    0 8px 32px rgba(31, 38, 135, 0.1), 0 1.5px 8px rgba(31, 38, 135, 0.08);
  --glass-highlight:
    0 0 0 2px rgba(255, 255, 255, 0.18), 0 0 24px rgba(255, 255, 255, 0.1);

  /* Textfarben */
  --text-main: #333333;
  --text-secondary: #757575;
  --text-placeholder: #888888;

  /* Sonstiges */
  --ok: #34d399;
  --warn: #f59e0b;
  --err: #f87171;
}
```

## 9. Komponenten-Mapping für dieses Repo

- Header: `<GlassSurface variant="header">` (sticky, z-20)
- Kategorie-Pillen: `<GlassPill category="task|event|note">`
- EntryCard: `<GlassCard category="task|event|note">` (mit optionalen Tags)
- InputSection: `<GlassInput>` (mit Mikrofon-Button)
- Tags: `<GlassPill size="small">`

## 10. Abnahme-Checkliste

- Hintergrund ist heller Gradient mit subtiler Textur
- Alle Glass-Elemente sind mattiert, poliert, mit Lichtreflexionen
- Kategorie-Tönungen werden korrekt verwendet
- Text ist überall klar lesbar (WCAG AA)
- Zeitformat ist HH:MM (24h)
- Eingabeleiste ist fixiert und poliert
- Mikrofon-Button ist poliert, abgesetzt
- Komponentenstruktur wie oben
- Keine eigenen Glass-Styles außerhalb der Glass-Komponenten
