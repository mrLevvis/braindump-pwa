# Guide: Tickets schreiben

## Sektionen (in dieser Reihenfolge)

1. **Commit-Typ** — der Conventional-Commit-Header für den Abschluss (`feat(timeline)`, `refactor(api)!`). Breaking Change mit `!` am Scope.
2. **Ziel** — ein, zwei Sätze: *was* das Ticket erreicht und *warum*.
3. **Festlegung** — getroffene Entscheidungen und das *Wie*. Was feststeht, nicht was noch offen ist.
4. **Akzeptanzkriterien** — prüfbare Checkboxen. Jede Zeile muss objektiv mit ja/nein beantwortbar sein.
5. **Schnittstelle (Skizze)** *(optional)* — Typen/Signaturen als Gerüst, **keine** Implementierung. Nur wenn das Ticket eine neue API oder Struktur einführt.
6. **Betroffene Dateien** — Pfade, die angefasst werden (Orientierung, kein Vertrag).
7. **Definition of Done** — ein konkreter, beobachtbarer Endzustand. Beantwortet: „Woran sehe ich, dass es fertig ist?"
8. **Abhängigkeiten** — Vorgänger-Tickets; Auswirkungen auf andere Tickets.

> **Abgrenzung:** *Festlegung* = Entscheidung/Wie · *Akzeptanzkriterien* = prüfbare Einzelbedingungen · *Definition of Done* = ein Gesamt-Endzustand als Beweis.

## Markdown-Konventionen

- **Sektions-Überschriften:** `# **Titel**` (H1 + fett).
- **Akzeptanzkriterien:** als `- [ ]`-Checkboxen, damit sie im Tracker abhakbar sind.
- **Bezeichner, Dateien, Kommandos:** in Inline-Backticks (`` `startTime` ``, `` `_shared/contract.ts` ``).
- **Schnittstellen:** in einem ```` ```ts ````-Block — ausschließlich Signaturen/Typen, kein Funktionskörper.

## Vorlage (Copy-Paste)

```md
# **Ticket-Titel**
`<FEATURE>: <ticket-title>`

# **Commit-Typ**
`scope(bereich)`

# **Ziel**
Ein bis zwei Sätze.

# **Festlegung**
- Entscheidung 1
- Entscheidung 2

# **Akzeptanzkriterien**
- [ ] Prüfbare Bedingung 1
- [ ] Prüfbare Bedingung 2

<!-- optional — weglassen wenn kein neues Interface -->
# **Schnittstelle (Skizze)**
​```ts
// nur Signaturen/Typen
​```

# **Betroffene Dateien**
`pfad/datei.ts`, `pfad/andere.ts`.

# **Definition of Done**
Konkreter Endzustand / Beispiel.

# **Abhängigkeiten**
- Vorgänger: …
- Auswirkungen: …
```
