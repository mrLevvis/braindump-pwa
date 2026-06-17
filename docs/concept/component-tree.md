# Komponentenstruktur (aktuell)

Die App ist in zwei Schichten aufgeteilt: Auth-Shell (`App`) und die eigentliche Anwendung (`AuthenticatedApp`).

```
App  (Root — prüft Auth-State, routet zu Auth-Pages oder der App)
 ├── AuthCallbackPage       (/auth/callback — Supabase Magic-Link-Landung)
 ├── LoginPage              (/login — E-Mail Magic Link)
 └── AuthenticatedApp       (Alle Ansichten nach Login)
      │
      ├── BrainDumpDashboard  (Standard-Ansicht "/")
      │    ├── CategoryFilterTabs       (TASK / EVENT / NOTE / SHOPPING — Filter-Pillen)
      │    ├── EntryList                (Geordnete Liste mit Datums-Trennern)
      │    │    ├── DateDivider         (Gruppen-Header je Datum)
      │    │    └── EntryCard           (Einzelner Eintrag, klickbar)
      │    │         └── EntryDetailPanel  (Sheet: Vollansicht, Bearbeiten, Löschen)
      │    │              ├── EntryEditForm    (Inline-Bearbeitung: Titel, Kategorie, Payload)
      │    │              └── DetailPanelMenu  (Aktionsmenü: Edit / Delete)
      │    └── (Auswahl-Modus: Massen-Delete, InputSection wird ausgeblendet)
      │
      ├── TimelineView        (/timeline/:date)
      │    ├── DayTabs         (Wochentag-Navigation)
      │    ├── DayGrid         (Stunden-Grid mit Pinch-to-Zoom Y-Achse)
      │    │    └── GridBlock  (Positionierter Eintrag auf dem Grid)
      │    └── UntimedSection  (Einträge ohne Uhrzeit)
      │
      ├── ShoppingView        (/shopping)
      │    └── ShoppingSection
      │         └── ShoppingItemRow
      │
      ├── AdminView           (/admin — nur für VITE_ADMIN_EMAIL)
      │
      ├── InputSection        (Global fixiert, wird im Auswahl-Modus versteckt)
      │    ├── TextInput / TextSubmitButton
      │    └── VoiceRecorderControl → VoiceRecordButton
      │
      ├── IngestPreviewSheet  (Bottom Sheet: KI-Ergebnis prüfen vor DB-Insert)
      │
      ├── FeedbackButton      (Floating Button — öffnet FeedbackDialog)
      │    └── FeedbackDialog  (Bug / Suggestion einreichen)
      │
      └── Toaster             (Sonner — globale Toast-Notifications)
```

## Feature-Verzeichnisse

```
src/
├── features/
│   ├── auth/          — Login, AuthCallback
│   ├── braindump/     — Kern-Feature: Entries, Store, Services, Views
│   ├── issues/        — Feedback/Bug-Reporting + Admin-Tabelle
│   ├── shopping/      — Einkaufslisten-Feature
│   └── timeline/      — Tages-Grid-Ansicht
├── components/        — Geteilte UI-Primitives (shadcn/ui-Wrapper, VoiceRecorder)
├── hooks/             — Selektoren & wiederverwendbare React-Hooks
├── lib/               — Routing, dateUtils, utils (cn)
├── services/auth/     — authService (Supabase Auth Calls)
└── store/             — authSlice (globaler Auth-State)
```
