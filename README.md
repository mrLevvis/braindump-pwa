# BrainDump PWA

Eine KI-gestützte Progressive Web App (PWA): Du schreibst oder sprichst unstrukturierte Gedanken ein, die KI übersetzt sie automatisch in typisierte Einträge (Aufgabe, Termin, Notiz, Einkauf) und legt sie in der Datenbank ab.

---

## Neu hier? Lies in dieser Reihenfolge

1. **[Architektur & Datenfluss](./docs/diagrams/architecture-comm.md)** — Überblick über alle Schichten (5 Min.)
2. **[Run Guide](./docs/setup/RUN_PROJECT.md)** — Projekt lokal starten
3. **[Supabase Setup](./docs/setup/supabase.md)** — DB, Auth und RLS einrichten (einmalig)
4. **[Edge Functions & Groq](./docs/setup/edge-function-groq-setup.md)** — KI-Pipeline deployen (einmalig)
5. **[Component Tree](./docs/concept/component-tree.md)** — Wo liegt was im Code?
6. **[Zustand Store Guide](./docs/guides/zustand-store-guide.md)** — Wie State und Actions funktionieren
7. **[Coding Principles](./docs/guides/coding-principles.md)** — Unsere Code-Regeln

---

## Tech Stack

| Layer | Technologie |
| :--- | :--- |
| **Framework** | React 19 |
| **Build Tool** | Vite 8 |
| **Sprache** | TypeScript 6 |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **State Management** | Zustand v5 |
| **Backend/DB** | Supabase (PostgreSQL + Auth + Edge Functions) |
| **KI-Anbieter** | Groq (Whisper + Llama, hinter Edge Function) |
| **Deployment** | Vercel (SPA-Rewrite via `vercel.json`) |

---

## Features (aktueller Stand)

| Feature | Status |
| :--- | :--- |
| Text-Input → KI-Strukturierung | ✅ |
| Voice-Input → Transkription → KI-Strukturierung | ✅ |
| Ingest-Preview (Review vor DB-Insert, editierbar) | ✅ |
| Login via Supabase Auth (Magic Link) | ✅ |
| Dashboard mit Eintrags-Liste & Kategorie-Filter | ✅ |
| Einträge bearbeiten & löschen | ✅ |
| Aufgaben als erledigt markieren | ✅ |
| KI-Priorisierung von Tasks (pro Tag, ephemer) | ✅ |
| Massen-Löschen per Auswahl-Modus | ✅ |
| Timeline-Ansicht (Tages-Grid, Pinch-to-Zoom Y) | ✅ |
| Shopping-Feature (eigene Liste) | ✅ |
| Feedback & Bug-Reporting (Issues) | ✅ |
| Admin-View (Issue-Übersicht, per E-Mail gesichert) | ✅ |

---

## Dokumentation (Hub)

### Architektur & Setup
* 🏗 **[Architektur & Datenfluss](./docs/diagrams/architecture-comm.md)** — Systemkomponenten und Separation of Concerns.
* 🗄 **[Supabase Setup](./docs/setup/supabase.md)** — DB-Initialisierung, Migrationen, Auth-Konfiguration und RLS.
* ⚡ **[Edge Functions & Groq](./docs/setup/edge-function-groq-setup.md)** — KI-Pipeline (process-brain-dump + prioritize-tasks) einrichten und deployen.

### Guidelines & Standards
* 💻 **[Coding Principles](./docs/guides/coding-principles.md)** — Manifesto für Clean Code (SRP, DRY, KISS, YAGNI).
* 📝 **[Git Commit Conventions](./docs/guides/commit-conventions.md)** — Verbindliche Regeln für semantische Commits.
* 🧠 **[Zustand Store Guide](./docs/guides/zustand-store-guide.md)** — Alle 5 Stores, State und Actions dokumentiert.
* 🎫 **[Ticket-Writing Guide](./docs/guides/ticket-writing-guide.md)** — Vorlage und Konventionen für Tickets.

### Konzept & Design
* 🎯 **[MVP Scope](./docs/concept/mvp-scope.md)** — Kernfunktionsumfang, KI-Vertrag und Feature-Status.
* 🌳 **[Component Tree](./docs/concept/component-tree.md)** — Aktuelle Komponentenstruktur und Feature-Verzeichnisse.
* 🎨 **[Design Styleguide](./docs/concept/design-styleguide.md)** — Glassmorphismus-Designsystem (Farben, Tokens, Prinzipien).

### Testing
* 🧪 **[Test-Eingaben](./docs/testing/test-inputs.md)** — Referenz-Inputs für alle Features inkl. erwarteter KI-Ausgaben.
