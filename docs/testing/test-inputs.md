# BrainDump – Test-Eingaben

> **Heute:** 2026-06-17 (Mittwoch)  
> Alle Dump-Eingaben sind rohe User-Inputs (Text oder Voice-Transkript), wie sie an die Edge Function gehen.  
> Datum-Erwartungen gelten für den Tag, an dem der Test ausgeführt wird — bei Wechsel des Datums entsprechend anpassen.

---

## 1 · TASK

### 1a – Undatiert, keine Uhrzeit (→ Off-Grid-Sheet)
> „Milch kaufen nicht vergessen."

**Erwartetes Ergebnis:** `TASK`, kein `date`, kein `startTime` → landet im Off-Grid-Sheet der Timeline.

---

### 1b – Datiert, keine Uhrzeit (→ Timeline, kein Zeitstempel)
> „Ich muss bis Montag die Steuererklärung einreichen."

**Erwartetes Ergebnis:** `TASK`, `date: 2026-06-22`, kein `startTime` → Timeline-Block ohne Uhrzeit.

---

### 1c – Datiert + Uhrzeit (→ Timeline mit Zeitstempel)
> „Morgen um 15 Uhr Paket bei der Post abholen."

**Erwartetes Ergebnis:** `TASK`, `date: 2026-06-18`, `startTime: 15:00`, `endTime: 15:30`.

---

### 1d – Heute + Uhrzeit, kein Datum genannt (implizit heute)
> „Um 18 Uhr noch kurz im Supermarkt vorbeischauen."

**Erwartetes Ergebnis:** `TASK`, `date: 2026-06-17` (implizit), `startTime: 18:00`, `endTime: 18:30`.

---

## 2 · EVENT

### 2a – Datum + explizite Zeitspanne
> „Freitag von 10 bis 11:30 Uhr Teammeeting."

**Erwartetes Ergebnis:** `EVENT`, `date: 2026-06-19`, `startTime: 10:00`, `endTime: 11:30`.

---

### 2b – Datum + Uhrzeit ohne explizites Ende (→ +60 Min.)
> „Zahnarzt nächsten Dienstag um 9 Uhr."

**Erwartetes Ergebnis:** `EVENT`, `date: 2026-06-23`, `startTime: 09:00`, `endTime: 10:00`.

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

## 4 · SHOPPING

### 4a – Einfache Einkaufsliste
> „Brot, Milch und Käse kaufen."

**Erwartetes Ergebnis:** `SHOPPING`, `items: ["Brot", "Milch", "Käse"]`, kein `date`.

---

### 4b – Einkaufsliste mit Kontext
> „Ich brauch heute noch Äpfel, Orangen und Joghurt vom Supermarkt."

**Erwartetes Ergebnis:** `SHOPPING`, `items: ["Äpfel", "Orangen", "Joghurt"]`, evtl. `date: 2026-06-17`, `tags: ["Supermarkt"]`.

---

### 4c – Shopping im Multi-Part-Dump (neben TASK)
> „Nicht vergessen: Waschmittel kaufen. Und morgen Arzttermin um 10 Uhr."

**Erwartetes Ergebnis:** Zwei Entries mit identischer `captureId`.  
→ `SHOPPING` „Waschmittel kaufen" (`items: ["Waschmittel"]`)  
→ `EVENT` oder `TASK` „Arzttermin" (`date: 2026-06-18`, `startTime: 10:00`)

---

### 4d – Ausführliche Einkaufsliste per Voice
> „Ähm, ich muss noch einkaufen gehen: Tomaten, Zwiebeln, Knoblauch, Olivenöl, und — warte — ach ja, Pasta auch noch."

**Erwartetes Ergebnis:** `SHOPPING`, `items` enthält alle fünf Artikel, keine doppelten, keine Füllwörter.

---

## 5 · Edge Cases (normalizeEntryContract)

### 5a – EVENT ohne Datum (→ wird zu TASK)
> „Schnell noch Steuerberater anrufen, so bald wie möglich."

**Erwartetes Ergebnis:** KI gibt evtl. `EVENT` zurück, aber ohne `date` → `normalizeEntryContract` stuft auf `TASK` herab.

---

### 5b – NOTE mit versehentlichem Zeitbezug (→ Zeit wird gestripped)
> „Gestern Abend um 22 Uhr kam mir die Idee, Caching auf Edge-Ebene zu lösen."

**Erwartetes Ergebnis:** `NOTE`, `date` und `startTime` werden von `normalizeEntryContract` gestripped — `category` bleibt `NOTE`.

---

### 5c – Ungültige endTime (vor startTime)
> „Meeting heute von 14 bis 13 Uhr."

**Erwartetes Ergebnis:** `EVENT` mit `startTime: 14:00`, `endTime` wird verworfen (liegt vor `startTime`) → Punkt-Termin.

---

## 6 · Multi-Part Dumps

### 6a – Zwei verschiedene Kategorien
> „Ähm, Montag halb zehn Steuerberater anrufen, und dann — ach ja — Alina hat heute Abend Geburtstag, ich hab noch kein Geschenk."

**Erwartetes Ergebnis:** Zwei Entries mit identischer `captureId`.  
→ `TASK` „Steuerberater anrufen" (`date: 2026-06-22`, `startTime: 09:30`)  
→ `TASK` oder `EVENT` „Geschenk für Alinas Geburtstag besorgen"

---

### 6b – Drei Kategorien, volle Bandbreite
> „Okay, also: Zahnarzt Freitag um 15 Uhr nicht vergessen. Und Milch und Brot kaufen. Und ich wollte noch irgendwo festhalten, dass ich das State-Management nochmal überdenken will, irgendwas stimmt da nicht."

**Erwartetes Ergebnis:** Drei Entries mit identischer `captureId`.  
→ `EVENT` „Zahnarzttermin" (`date: 2026-06-19`, `startTime: 15:00`, `endTime: 16:00`)  
→ `SHOPPING` „Milch und Brot kaufen" (`items: ["Milch", "Brot"]`)  
→ `NOTE` „State-Management überdenken"

---

### 6c – Zwei Tasks, gleiche Kategorie
> „Ich muss noch die Rechnung an den Kunden schicken und außerdem den PR-Review von Max nicht vergessen."

**Erwartetes Ergebnis:** Zwei `TASK`-Entries mit identischer `captureId`, beide undatiert.

---

## 7 · Voice-Style (messy, single entry)

### 7a – Zögernd, mit Füllwörtern, ein Entry
> „Ähm… ja, also ich wollte sagen, dass ich — warte — irgendwie noch diese Präsentation für Donnerstag fertigmachen muss, die für das Kundenprojekt."

**Erwartetes Ergebnis:** `TASK`, `date: 2026-06-18` (Donnerstag morgen), kein `startTime`, `tags: ["Arbeit"]` o.ä.

---

### 7b – Voice, Multi-Part (kombiniert mit 6)
> „Ähm okay also… Montag, ne? Montag halb zehn, Steuerberater anrufen wegen der Abrechnung vom letzten Quartal. Und ich muss irgendwie noch — warte — Alina hat heute Abend Geburtstag, ich hab noch gar kein Geschenk, scheiße. Ach ja und Milch kaufen nicht vergessen, und Brot. Hmm, und ich wollte eigentlich noch aufschreiben dass ich die neue Projektstruktur komplett überdenken will, irgendwas mit Feature-Slicing, da hatte ich gestern Abend so ne Idee… ähm ja und Freitag 15 Uhr Zahnarzt, das stand irgendwo."

**Erwartetes Ergebnis:** Fünf Entries mit identischer `captureId`.  
→ `TASK` Steuerberater anrufen (`date: 2026-06-22`, `startTime: 09:30`)  
→ `TASK` Geschenk für Alina  
→ `SHOPPING` Milch und Brot (`items: ["Milch", "Brot"]`)  
→ `NOTE` Projektstruktur / Feature-Slicing überdenken  
→ `EVENT` Zahnarzt (`date: 2026-06-19`, `startTime: 15:00`)

---

## 8 · Ingest Preview (Review-Sheet)

> Testet den Preview-Flow nach dem Ingest: prüfen, bearbeiten, einzelne Entwürfe löschen, bestätigen oder verwerfen.  
> **Setup für alle Tests:** Beliebigen Dump senden (z.B. aus Abschnitt 6b — drei Entries).

### 8a – Bestätigen ohne Änderungen
**Schritte:**
1. Dump senden → Preview-Sheet öffnet sich.
2. Alle Entwürfe durchsehen, nichts ändern.
3. „Speichern" tippen.

**Erwartetes Ergebnis:** Sheet schließt sich, Toast „Einträge gespeichert.", alle Entries erscheinen im Dashboard.

---

### 8b – Entwurf bearbeiten vor dem Speichern
**Schritte:**
1. Dump senden → Preview-Sheet öffnet sich.
2. Auf einen Entwurf tippen → Edit-Dialog öffnet sich.
3. Titel ändern, Kategorie ändern oder Datum hinzufügen.
4. „Speichern" im Dialog, dann „Speichern" im Sheet.

**Erwartetes Ergebnis:** Der geänderte Entwurf erscheint mit den neuen Werten im Dashboard. Original-Entwürfe der anderen Entries unverändert.

---

### 8c – Einzelnen Entwurf aus dem Preview löschen
**Schritte:**
1. Multi-Part-Dump mit ≥2 Entries senden.
2. Trash-Icon eines Entwurfs tippen → Bestätigungs-Dialog erscheint.
3. „Entfernen" bestätigen.
4. Verbleibende Entwürfe „Speichern".

**Erwartetes Ergebnis:** Nur der gelöschte Entwurf fehlt im Dashboard; die anderen werden gespeichert.

---

### 8d – Letzten Entwurf löschen (→ Preview schließt sich automatisch)
**Schritte:**
1. Single-Entry-Dump senden → Preview-Sheet öffnet sich.
2. Trash-Icon tippen → Bestätigung → „Entfernen".

**Erwartetes Ergebnis:** Sheet schließt sich sofort, kein DB-Write, kein Eintrag im Dashboard.

---

### 8e – Verwerfen ohne Speichern
**Schritte:**
1. Dump senden → Preview-Sheet öffnet sich.
2. „Verwerfen" tippen.

**Erwartetes Ergebnis:** Sheet schließt sich, kein DB-Write, kein Eintrag im Dashboard.

---

## 9 · Entry-Interaktionen (nach Ingest)

> Testet Aktionen auf bereits gespeicherten Einträgen im Dashboard.

### 9a – Task abhaken
**Schritte:**
1. `TASK`-Entry ingesten.
2. Entry-Karte antippen → Detail-Panel öffnet sich.
3. Checkbox / Toggle „Erledigt" aktivieren.

**Erwartetes Ergebnis:** Entry erscheint als durchgestrichen / erledigt markiert. Nach Reload bleibt Status erhalten (`completed: true` in DB).

---

### 9b – Task wieder auf offen setzen
**Schritte:**
1. Erledigten `TASK` antippen → Detail-Panel öffnet sich.
2. Toggle wieder deaktivieren.

**Erwartetes Ergebnis:** Entry erscheint wieder als offen (`completed: false`).

---

### 9c – Entry bearbeiten (Titel + Kategorie)
**Schritte:**
1. Beliebigen Entry antippen → Detail-Panel → Edit-Button.
2. Titel ändern, Kategorie auf eine andere setzen.
3. Speichern.

**Erwartetes Ergebnis:** Entry zeigt neuen Titel und neue Kategorie. Detail-Panel schließt sich, Toast erscheint.

---

### 9d – Entry löschen mit Bestätigung
**Schritte:**
1. Entry antippen → Detail-Panel → Löschen-Button.
2. Bestätigungs-Dialog erscheint → „Löschen" bestätigen.

**Erwartetes Ergebnis:** Entry verschwindet aus dem Dashboard. Nach Reload nicht mehr vorhanden.

---

### 9e – Löschen abbrechen
**Schritte:**
1. Entry antippen → Löschen-Button → Bestätigungs-Dialog.
2. „Abbrechen" tippen.

**Erwartetes Ergebnis:** Dialog schließt sich, Entry bleibt erhalten.

---

## 10 · Auswahl-Modus (Massen-Delete)

### 10a – Mehrere Entries löschen
**Setup:** Mindestens 3 Entries im Dashboard.

**Schritte:**
1. Auswahl-Modus aktivieren (Long-Press auf Entry oder Auswahl-Button).
2. Mindestens 2 Entries auswählen.
3. Löschen-Action ausführen → Bestätigung.

**Erwartetes Ergebnis:**
- Nur die ausgewählten Entries werden gelöscht.
- `InputSection` ist im Auswahl-Modus ausgeblendet.
- Nach dem Löschen: Auswahl-Modus deaktiviert, InputSection wieder sichtbar.

---

### 10b – Auswahl aufheben ohne Löschen
**Schritte:**
1. Auswahl-Modus aktivieren, Entries auswählen.
2. Abbrechen / Auswahl-Modus beenden.

**Erwartetes Ergebnis:** Alle Entries bleiben erhalten, kein DB-Write.

---

## 11 · Kategorie-Filter

### 11a – Einzelne Kategorie filtern
**Setup:** Dashboard mit Entries aller vier Kategorien (TASK, EVENT, NOTE, SHOPPING).

**Schritte:**
1. Filter-Tab „TASK" antippen.

**Erwartetes Ergebnis:** Nur TASK-Entries werden angezeigt, alle anderen ausgeblendet.

---

### 11b – Mehrere Kategorien kombinieren
**Schritte:**
1. Filter-Tab „TASK" antippen.
2. Zusätzlich „NOTE" antippen.

**Erwartetes Ergebnis:** TASK und NOTE werden angezeigt, EVENT und SHOPPING ausgeblendet.

---

### 11c – Filter zurücksetzen
**Schritte:**
1. Beliebigen Filter setzen.
2. Aktiven Tab erneut antippen oder „Alle"-Tab wählen.

**Erwartetes Ergebnis:** Alle Entries werden wieder angezeigt.

---

## 12 · Priorisierung (Timeline-Ansicht)

> Button `Sparkles` in der Timeline-Ansicht, aktiver Tag. Testet die `prioritize-tasks`-Edge-Function + ephemere Sortierung.

### 12a – Fünf ungeordnete Tasks, klare Dringlichkeitsunterschiede

**Setup:** Folgenden Dump ingesten, dann auf den entsprechenden Tag in der Timeline navigieren:
> „Ich muss heute noch: Steuererklärung einreichen Deadline ist heute Abend, kurz Nespresso-Kapseln bestellen, den kritischen Bug im Prod-System fixen den der Kunde gemeldet hat, die Spülmaschine ausräumen, und den Quartalsbericht für das Meeting morgen früh fertigstellen."

**Nach Klick auf Sparkles-Button:**
→ Reihenfolge ändert sich sichtbar (plausible Priorität: Bug > Steuererklärung > Quartalsbericht > Nespresso > Spülmaschine o.ä.)  
→ Kein DB-Write (DevTools → Network: kein `INSERT`/`UPDATE` auf `braindump_entries`)  
→ Sparkles-Icon zeigt aktiven Zustand (z.B. Farbe ändert sich)

**Nach Reload:**
→ Ursprüngliche Reihenfolge wiederhergestellt, Icon wieder inaktiv.

---

### 12b – EVENTs und NOTEs bleiben unberührt

**Setup:** Mix aus 3 Tasks + 1 Event + 1 Note auf demselben Tag.

**Nach Klick auf Sparkles:**
→ Nur die `TASK`-Entries werden neu sortiert.  
→ `EVENT`- und `NOTE`-Entries erscheinen unverändert.  
→ Kein Fehler im UI.

---

### 12c – Ein einzelner Task (Trivialfall)

**Setup:** Nur ein `TASK` für den aktiven Tag.

**Nach Klick auf Sparkles:**
→ Kein Fehler, kein Flackern, Reihenfolge bleibt identisch.

---

### 12d – Kein Task, nur EVENTs / NOTEs

**Setup:** Aktiver Tag hat Entries, aber kein einziges `TASK`.

**Nach Klick auf Sparkles:**
→ Button reagiert, kein Fehler, keine sichtbare Änderung.  
→ Edge Function wird **nicht** aufgerufen (kein Netzwerk-Request).

---

## 13 · Shopping-View

> Erreichbar über den Shopping-Button im Dashboard oder `/shopping`.

### 13a – Shopping-Eintrag aus Dump erscheint automatisch

**Setup:** Dump mit `SHOPPING`-Kategorie ingesten (z.B. 4a).

**Erwartetes Ergebnis:**
→ In der Shopping-View erscheinen die einzelnen `items` als separate, abhakbare Zeilen.  
→ `source_dump`-Referenz verknüpft den Item mit dem ursprünglichen Dump.

---

### 13b – Item abhaken

**Schritte:**
1. Shopping-View öffnen.
2. Ein Item abhaken.

**Erwartetes Ergebnis:** Item erscheint als erledigt (durchgestrichen / anderer Stil). Nach Reload bleibt Status erhalten (`is_done: true`).

---

### 13c – Item löschen

**Schritte:**
1. Shopping-View öffnen.
2. Item per Swipe oder Button löschen.

**Erwartetes Ergebnis:** Item verschwindet aus der Liste. Nach Reload nicht mehr vorhanden.

---

## 14 · Feedback & Issues

### 14a – Bug-Meldung einreichen

**Schritte:**
1. Feedback-Button (Floating Button) antippen.
2. Typ „Bug" auswählen, Titel und Beschreibung ausfüllen.
3. Absenden.

**Erwartetes Ergebnis:**
→ Dialog schließt sich, Toast erscheint.  
→ In der Admin-View (`/admin`) erscheint der neue Eintrag mit Status `open` und Typ `bug`.  
→ `user_email` ist korrekt befüllt.

---

### 14b – Verbesserungsvorschlag einreichen

**Schritte:**
1. Feedback-Button antippen.
2. Typ „Suggestion" auswählen, Titel ausfüllen (Beschreibung optional).
3. Absenden.

**Erwartetes Ergebnis:** Wie 14a, aber Typ `suggestion` in der Admin-View.

---

### 14c – Admin-View: Status eines Issues ändern

**Voraussetzung:** Eingeloggt mit der `VITE_ADMIN_EMAIL`-Adresse.

**Schritte:**
1. `/admin` aufrufen.
2. Einen Issue von `open` auf `in_progress` oder `done` setzen.

**Erwartetes Ergebnis:** Status ändert sich sofort in der Tabelle. Nach Reload bleibt der neue Status erhalten.

---

### 14d – Admin-View für Nicht-Admins gesperrt

**Schritte:**
1. Mit einem Account einloggen, dessen E-Mail **nicht** `VITE_ADMIN_EMAIL` entspricht.
2. URL `/admin` direkt aufrufen.

**Erwartetes Ergebnis:** Automatische Weiterleitung zum Dashboard, kein Admin-Inhalt sichtbar.
