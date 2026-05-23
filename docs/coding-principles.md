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