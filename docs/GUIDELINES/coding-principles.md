# **SRP (Single Responsibility Principle)**
Jede Datei/Funktion hat nur *eine* Aufgabe. (z.B. React rendert nur das UI; Services machen API-Calls; der Store hält den State).

# **DRY (Don't Repeat Yourself)**
Vermeide doppelte Geschäftslogik. Nutze Utility-Funktionen. *(Achtung: Blinde Abstraktion zu früh ist schlimmer als etwas doppelter Code).*

# **KISS (Keep It Simple, Stupid)**
Lesbarkeit schlägt "cleveren" Code. Nutze ausschließlich sprechende, englische Bezeichnungen. Keine komplexen Verschachtelungen.

# **YAGNI (You Ain't Gonna Need It)**
Baue nur Features, die *jetzt sofort* gebraucht werden. Kein Vorrats-Code für Eventualitäten.

# **SoC (Separation of Concerns)**
Strikte Trennung von UI (`components`), State (`store`), Logik (`features`) und Infrastruktur (`services`).

---

# **UI-Readability in React-Komponenten**
Lange `className`-Strings, Style-Mappings und Formatter nicht inline im JSX halten, sondern als benannte Konstanten/Helper auf Modulebene auslagern. Ziel: JSX bleibt primär Struktur und Inhalt.

# **Presentational vs. Container-Komponenten**
Kleine, rein darstellende Teile (z.B. Badge, Tag-Liste) als lokale Presentational-Komponenten kapseln. Die Hauptkomponente orchestriert nur Daten und Layout.

# **Defensive Rendering & Fail-Safe Defaults**
UI darf bei unvollständigen oder fehlerhaften Daten nicht brechen. Beispiele: `tags ?? []`, Fallback-Zeit (`--:--`) bei ungültigem Datum, Early Returns für leere States.

# **Semantisches HTML zuerst**
Passende HTML-Elemente bevorzugen (z.B. `time` statt `span` für Uhrzeiten inkl. `dateTime`), damit Accessibility und Maschinenlesbarkeit verbessert werden.

# **Immutability by Default**
Props in Komponenten als `Readonly<...>` bzw. `readonly` modellieren, wenn keine Mutation vorgesehen ist. Das verhindert Seiteneffekte und macht Intentionen klar.

# **Stabile Keys bei Listenrendering**
`key`-Werte müssen pro Liste stabil und eindeutig sein. Bei potenziell doppelten Labels (z.B. Tags aus Parsern/KI) keine kollidierenden Keys verwenden.