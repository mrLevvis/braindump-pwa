# BrainDump – Test-Eingaben
 
> **Heute:** 2026-06-07 (Sonntag)  
> Alle Einträge sind rohe User-Inputs (Text oder Voice-Transkript), wie sie an die Edge Function gehen.
 
---
 
## 1 · TASK
 
### 1a – Undatiert, keine Uhrzeit (→ Off-Grid-Sheet)
> „Milch kaufen nicht vergessen."
 
**Erwartetes Ergebnis:** `TASK`, kein `date`, kein `startTime` → landet im Off-Grid-Sheet.
 
---
 
### 1b – Datiert, keine Uhrzeit (→ Timeline, kein Zeitstempel)
> „Ich muss bis Montag die Steuererklärung einreichen."
 
**Erwartetes Ergebnis:** `TASK`, `date: 2026-06-08`, kein `startTime` → Timeline-Block ohne Uhrzeit.
 
---
 
### 1c – Datiert + Uhrzeit (→ Timeline mit Zeitstempel)
> „Morgen um 15 Uhr Paket bei der Post abholen."
 
**Erwartetes Ergebnis:** `TASK`, `date: 2026-06-08`, `startTime: 15:00`, `endTime: 15:30`.
 
---
 
### 1d – Heute + Uhrzeit, kein Datum genannt (implizit heute)
> „Um 18 Uhr noch kurz im Supermarkt vorbeischauen."
 
**Erwartetes Ergebnis:** `TASK`, `date: 2026-06-07` (implizit), `startTime: 18:00`, `endTime: 18:30`.
 
---
 
## 2 · EVENT
 
### 2a – Datum + explizite Zeitspanne
> „Freitag von 10 bis 11:30 Uhr Teammeeting."
 
**Erwartetes Ergebnis:** `EVENT`, `date: 2026-06-12`, `startTime: 10:00`, `endTime: 11:30`.
 
---
 
### 2b – Datum + Uhrzeit ohne explizites Ende (→ +60 Min.)
> „Zahnarzt nächsten Dienstag um 9 Uhr."
 
**Erwartetes Ergebnis:** `EVENT`, `date: 2026-06-09`, `startTime: 09:00`, `endTime: 10:00`.
 
---
 
### 2c – Nur Datum, keine Uhrzeit
> „Jonathans Geburtstag ist am 20. Juni."
 
**Erwartetes Ergebnis:** `EVENT`, `date: 2026-06-20`, kein `startTime`.
 
---
 
## 3 · NOTE
 
### 3a – Reiner Gedanke, zeitlos
> „Feature-Slicing könnte die Projektstruktur deutlich lesbarer machen."
 
**Erwartetes Ergebnis:** `NOTE`, leeres `payload` (keine Zeitfelder, keine Tags).
 
---
 
### 3b – Gedanke mit Kontext-Tags
> „Der Artikel über LLM-Benchmarking war wirklich gut, unbedingt nochmal lesen."
 
**Erwartetes Ergebnis:** `NOTE`, `tags: ["Lesen", "Technik"]` (o.ä.).
 
---
 
## 4 · Edge Cases (normalizeEntryContract)
 
### 4a – EVENT ohne Datum (→ wird zu TASK)
> „Schnell noch Steuerberater anrufen, so bald wie möglich."
 
**Erwartetes Ergebnis:** KI gibt evtl. `EVENT` zurück, aber ohne `date` → `normalizeEntryContract` stuft auf `TASK` herab.
 
---
 
### 4b – NOTE mit versehentlichem Zeitbezug (→ Zeit wird gestripped)
> „Gestern Abend um 22 Uhr kam mir die Idee, Caching auf Edge-Ebene zu lösen."
 
**Erwartetes Ergebnis:** `NOTE`, `date` und `startTime` werden von `normalizeEntryContract` gestripped — `category` bleibt `NOTE`.
 
---
 
### 4c – Ungültige endTime (vor startTime)
> „Meeting heute von 14 bis 13 Uhr."
 
**Erwartetes Ergebnis:** `EVENT` mit `startTime: 14:00`, `endTime` wird verworfen (liegt vor `startTime`) → Punkt-Termin.
 
---
 
## 5 · Multi-Part Dumps (D1-Szenario)
 
### 5a – Zwei verschiedene Kategorien
> „Ähm, Montag halb zehn Steuerberater anrufen, und dann — ach ja — Alina hat heute Abend Geburtstag, ich hab noch kein Geschenk."
 
**Erwartetes Ergebnis:** Zwei Entries mit identischer `captureId`.  
→ Entry 1: `TASK` „Steuerberater anrufen" (`date: 2026-06-08`, `startTime: 09:30`)  
→ Entry 2: `TASK` oder `EVENT` „Geschenk für Alinas Geburtstag besorgen"
 
---
 
### 5b – Drei Kategorien, volle Bandbreite
> „Okay, also: Zahnarzt Freitag um 15 Uhr nicht vergessen. Und Milch und Brot kaufen. Und ich wollte noch irgendwo festhalten, dass ich das State-Management nochmal überdenken will, irgendwas stimmt da nicht."
 
**Erwartetes Ergebnis:** Drei Entries mit identischer `captureId`.  
→ Entry 1: `EVENT` „Zahnarzttermin" (`date: 2026-06-12`, `startTime: 15:00`, `endTime: 16:00`)  
→ Entry 2: `TASK` „Milch und Brot kaufen" (undatiert)  
→ Entry 3: `NOTE` „State-Management überdenken"
 
---
 
### 5c – Zwei Tasks, gleiche Kategorie
> „Ich muss noch die Rechnung an den Kunden schicken und außerdem den PR-Review von Max nicht vergessen."
 
**Erwartetes Ergebnis:** Zwei `TASK`-Entries mit identischer `captureId`, beide undatiert.
 
---
 
## 6 · Voice-Style (messy, single entry)
 
### 6a – Zögernd, mit Füllwörtern, ein Entry
> „Ähm… ja, also ich wollte sagen, dass ich — warte — irgendwie noch diese Präsentation für Donnerstag fertigmachen muss, die für das Kundenprojekt."
 
**Erwartetes Ergebnis:** `TASK`, `date: 2026-06-11` (Donnerstag), kein `startTime`, `tags: ["Arbeit"]` o.ä.
 
---
 
### 6b – Voice, Multi-Part (kombiniert mit 5)
> „Ähm okay also… Montag, ne? Montag halb zehn, Steuerberater anrufen wegen der Abrechnung vom letzten Quartal. Und ich muss irgendwie noch — warte — Alina hat heute Abend Geburtstag, ich hab noch gar kein Geschenk, scheiße. Ach ja und Milch kaufen nicht vergessen, und Brot. Hmm, und ich wollte eigentlich noch aufschreiben dass ich die neue Projektstruktur komplett überdenken will, irgendwas mit Feature-Slicing, da hatte ich gestern Abend so ne Idee… ähm ja und Freitag 15 Uhr Zahnarzt, das stand irgendwo."
 
**Erwartetes Ergebnis:** Fünf Entries mit identischer `captureId`.  
→ `TASK` Steuerberater anrufen (Montag 09:30)  
→ `TASK` Geschenk für Alina  
→ `TASK` Milch und Brot kaufen  
→ `NOTE` Projektstruktur / Feature-Slicing überdenken  
→ `EVENT` Zahnarzt Freitag 15:00


---

## 7 · Priorisierung (feat: prioritization)

> Button `Sparkles` in der Timeline-Ansicht, aktiver Tag. Testet die `prioritize-tasks`-Edge-Function + ephemäre Sortierung.

### 7a – Fünf ungeordnete Tasks, klare Dringlichkeitsunterschiede

**Setup:** Folgenden Dump ingesten, dann auf den entsprechenden Tag navigieren:
> „Ich muss heute noch: Steuererklärung einreichen Deadline ist heute Abend, kurz Nespresso-Kapseln bestellen, den kritischen Bug im Prod-System fixen den der Kunde gemeldet hat, die Spülmaschine ausräumen, und den Quartalsbericht für das Meeting morgen früh fertigstellen.“

**Erwartetes Ergebnis nach Ingest (5 `TASK`-Entries, undatiert oder heute):**  
→ Steuererklärung einreichen (Deadline heute)  
→ Nespresso-Kapseln bestellen  
→ Kritischen Bug fixen  
→ Spülmaschine ausräumen  
→ Quartalsbericht fertigstellen  

**Nach Klick auf Sparkles-Button:**  
→ Reihenfolge ändert sich sichtbar (plausible Priorität: Bug > Steuererklärung > Quartalsbericht > Nespresso > Spülmaschine o.ä.)  
→ Kein DB-Write (DevTools → Network: kein `INSERT`/`UPDATE` auf `braindump_entries__test`)  
→ Button-Icon leuchtet blau (aktive Priorisierung für diesen Tag)

**Nach Reload:**  
→ Ursprüngliche Reihenfolge wiederhergestellt, Button-Icon wieder grau

---

### 7b – EVENTs und NOTEs bleiben unberührt

**Setup:** Mix aus 3 Tasks + 1 Event + 1 Note auf demselben Tag (aus 5b oder manuell ingesten).

**Nach Klick auf Sparkles:**  
→ Nur die `TASK`-Entries werden neu sortiert  
→ `EVENT`- und `NOTE`-Entries erscheinen unverändert am Ende der Ganztags-Liste  
→ Kein Fehler im UI

---

### 7c – Ein einzelner Task (Trivialfall)

**Setup:** Nur ein `TASK` für den aktiven Tag.

**Nach Klick auf Sparkles:**  
→ Kein Fehler, kein Flackern, Reihenfolge bleibt identisch

---

### 7d – Kein Task, nur EVENTs / NOTEs

**Setup:** Aktiver Tag hat Entries, aber kein einziges `TASK`.

**Nach Klick auf Sparkles:**  
→ Button reagiert, kein Fehler, keine sichtbare Änderung  
→ Edge Function wird **nicht** aufgerufen (Service gibt `{ orderedTaskIds: [] }` zurück, bevor er die Netzwerkanfrage macht)
