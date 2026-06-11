# Setup-Guide: Brain-Dump Edge Function (Supabase + Groq)

Diese Doku beschreibt, wie die KI-Pipeline (`process-brain-dump`) von Grund auf
eingerichtet wird: CLI installieren, Keys besorgen, deployen, testen.

> **Plattform:** Windows / PowerShell
> **Beteiligte Dienste:** Supabase (Edge Function + Secrets), Groq (KI-API)

---

## 0. Überblick: Wie hängt alles zusammen?

Der KI-Anbieter (Groq) ist hinter Supabase Edge Functions versteckt
("BFF" / Sicherheitsschicht). Der Groq-Key liegt **nur in der Cloud** und
verlässt sie nie.

**Ingest-Pfad** (Text/Audio → strukturierte Entries):
```
Frontend  --(Text/Audio)-->  process-brain-dump  --(Key aus Secrets)-->  Groq
                                   |
                     validiert jeden Entry im Batch
                     vergibt captureId (UUID) serverseitig
                                   |
Frontend  <--({ captureId, entries: StructuredEntry[] })-----+
```

**Priorisierungs-Pfad** (on-demand, kein DB-Write):
```
Frontend  --({ tasks: [{id, title, summary}] })-->  prioritize-tasks  --> Groq
                                                          |
                                          gibt nur IDs zurück (ephemer)
                                                          |
Frontend  <--({ orderedTaskIds: string[] })-------------+
```

---

## 1. Voraussetzungen

- **Node.js** installiert (für das Frontend-Projekt selbst): https://nodejs.org/
- Ein **Supabase-Account**: https://supabase.com
- Ein **Groq-Account**: https://console.groq.com

---

## 2. Supabase CLI installieren (Windows / Scoop)

> `npm install -g supabase` wird **nicht** unterstützt. Auf Windows läuft die
> Installation über **Scoop** (Standalone-Binary, global nutzbar).

PowerShell öffnen (normales Fenster, **nicht** als Administrator):

```powershell
# Scoop installieren (nur falls noch nicht vorhanden)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# Supabase-CLI über Scoop installieren
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Installation prüfen
supabase --version
```

Später aktualisieren mit: `scoop update supabase`

---

## 3. Keys & Token besorgen

Hier kommen alle Geheimnisse her, die unten gebraucht werden.
**Keine davon ins Repo committen oder im Klartext teilen.**

### 3a. Supabase Access Token (für die CLI)
Wird gebraucht, damit die CLI weiß, wer du bist (für `secrets set`, `deploy`).

1. Im Browser öffnen: https://supabase.com/dashboard/account/tokens
2. **"Generate new token"** → Namen vergeben (z.B. `cli-braindump`) → erstellen.
3. Token sofort kopieren (**wird nur EINMAL angezeigt**).

### 3b. Supabase Project-Ref (welches Projekt?)
1. Im Dashboard das Projekt öffnen.
2. **Project Settings → General** → dort steht die "Reference ID".
   (Alternativ steht sie in der URL: `.../dashboard/project/DEINE-REF`)

### 3c. Supabase anon/publishable Key (zum Testen der Function)
1. Dashboard → **Project Settings → API**.
2. Unter "Project API keys" den **`anon` `public`** Key kopieren.

### 3d. Groq API Key (die eigentliche KI)
1. Im Browser: https://console.groq.com → einloggen.
2. Menüpunkt **API Keys** → **Create API Key** → Namen vergeben → erstellen.
3. Den `gsk_...`-Wert sofort kopieren (**wird nur EINMAL angezeigt**).

> **Sicherheit:** Ist ein Key mal versehentlich geleakt (Chat, Screenshot, Log),
> sofort auf console.groq.com widerrufen ("Revoke"/"Delete") und neu erstellen.
> Ein fremder kann sonst auf deine Kosten Anfragen stellen.

---

## 4. Projekt mit Supabase verbinden (einmalig)

```powershell
# 1. Einloggen (öffnet den Browser)
supabase login

# 2. Lokalen supabase/-Ordner anlegen (nur falls noch nicht vorhanden)
supabase init

# 3. Lokalen Ordner mit dem Cloud-Projekt verknüpfen
supabase link --project-ref DEINE_PROJECT_REF      # aus Schritt 3b
```

### Falls `supabase login` zickt (Windows-Problem)
Manchmal wird der Login-Token nicht sauber gespeichert und spätere Befehle
melden *"Access token not provided"*. Workaround: Token direkt mitgeben.

```powershell
# Token aus Schritt 3a in die Umgebungsvariable setzen.
# ACHTUNG: gilt nur für DIESES PowerShell-Fenster. Beim Schließen weg.
$env:SUPABASE_ACCESS_TOKEN="DEIN_SUPABASE_TOKEN"
```

---

## 5. Edge Functions anlegen

```powershell
supabase functions new process-brain-dump
supabase functions new prioritize-tasks
```

Erzeugt die Ordner `supabase/functions/process-brain-dump/` und
`supabase/functions/prioritize-tasks/`.
Beide teilen sich denselben Groq-Key (Abschnitt 6).
Datei-Struktur: siehe Abschnitt 9.

---

## 6. Groq-Key sicher in die Cloud legen

```powershell
# Token muss gesetzt sein (siehe 4 / Workaround), sonst "Access token not provided".
supabase secrets set GROQ_API_KEY=DEIN_GROQ_KEY     # aus Schritt 3d
```

> Der Key landet damit ausschließlich in den Supabase-Secrets der Cloud.
> Im Code wird er über `Deno.env.get("GROQ_API_KEY")` gelesen.

---

## 7. Functions deployen

```powershell
# Ingest-Pipeline
supabase functions deploy process-brain-dump --no-verify-jwt

# Priorisierung (on-demand, kein DB-Write)
supabase functions deploy prioritize-tasks --no-verify-jwt
```

- `--no-verify-jwt`: schaltet die Login-Pflicht ab (passend zum MVP **ohne Auth**).
- Die Warnung **"Docker is not running" kann ignoriert werden** – Docker braucht
  man nur fürs *lokale* Testen, nicht fürs Deployen in die Cloud.

> **WICHTIG:** Nach jeder Änderung an einem Secret (Abschnitt 6) müssen **beide**
> Functions neu deployed werden, sonst ziehen sie den neuen Wert nicht!

---

## 8. Functions testen (PowerShell)

PowerShell ist bei `curl` zickig → wir nutzen `Invoke-RestMethod`.
PowerShell versteckt bei Fehlern den Antwort-Body → der `try/catch` macht ihn
sichtbar (zeigt das `details`-Feld mit dem echten Fehler).

Den anon key einmalig setzen (aus Abschnitt 3c / `.env.local`):

```powershell
$anonKey = $env:VITE_SUPABASE_ANON_KEY   # oder direkt als String eintragen
$headers = @{ "apikey" = $anonKey; "Content-Type" = "application/json" }
```

### 8a. process-brain-dump

```powershell
$body = '{"text": "Ich muss morgen um 15 Uhr Brot kaufen"}'

try {
  Invoke-RestMethod -Uri "https://woubazfojtzsfpxrtxqa.supabase.co/functions/v1/process-brain-dump" -Method Post -Headers $headers -Body $body
} catch {
  $stream = $_.Exception.Response.GetResponseStream()
  $reader = New-Object System.IO.StreamReader($stream)
  Write-Host $reader.ReadToEnd()
}
```

**Erwartete Antwort:**
```json
{
  "captureId": "550e8400-e29b-41d4-a716-446655440000",
  "entries": [
    {
      "category": "TASK",
      "title": "Morgen um 15 Uhr Brot kaufen",
      "sourceExcerpt": "Ich muss morgen um 15 Uhr Brot kaufen",
      "summary": ["Brot morgen um 15 Uhr kaufen"],
      "payload": { "date": "...", "startTime": "15:00", "endTime": "15:30", "tags": ["Einkauf"] }
    }
  ]
}
```

Enthält ein Dump mehrere eigenständige Gedanken, gibt die Function entsprechend mehrere
Objekte im `entries`-Array zurück — alle mit derselben `captureId`.

---

### 8b. prioritize-tasks

```powershell
$body = @'
{
  "tasks": [
    { "id": "id-1", "title": "Steuererklärung einreichen", "summary": ["Deadline heute Abend"] },
    { "id": "id-2", "title": "Milch kaufen", "summary": ["Supermarkt"] },
    { "id": "id-3", "title": "Kritischen Bug fixen", "summary": ["Kunde hat gemeldet", "Prod-System"] }
  ]
}
'@

try {
  Invoke-RestMethod -Uri "https://woubazfojtzsfpxrtxqa.supabase.co/functions/v1/prioritize-tasks" -Method Post -Headers $headers -Body $body
} catch {
  $stream = $_.Exception.Response.GetResponseStream()
  $reader = New-Object System.IO.StreamReader($stream)
  Write-Host $reader.ReadToEnd()
}
```

**Erwartete Antwort:**
```json
{ "orderedTaskIds": ["id-3", "id-1", "id-2"] }
```

IDs, die im Input nicht enthalten waren, werden von der Function herausgefiltert
(kein Halluzinations-Risiko).

---

### Fehler-Codes als Wegweiser (beide Functions)
| Code | Bedeutung | Wo suchen |
| :--- | :--- | :--- |
| **401** | anon key falsch/fehlt **ODER** "Invalid API Key" von Groq | Schritt 3c bzw. 3d/6 |
| **400** | Request-Body kaputt oder Pflichtfeld fehlt | Test-Body prüfen |
| **500** | `GROQ_API_KEY` nicht in den Secrets angekommen | Schritt 6 + neu deployen (7) |
| **502** | Groq selbst meckert (Key, Modellname, ...) | `details`-Feld lesen |

> **Logs ansehen:** Dashboard → Functions → jeweilige Function → Tab **Logs**.
> Die "booted"-Zeile ist nur der Start; der echte Fehler steht in einer Zeile
> mit `level: error`.

---

## 9. Datei-Struktur der Functions

```
supabase/
└── functions/
    ├── _shared/
    │   ├── contract.ts          # KI-Vertrag: StructuredEntry, IngestResponse, ENTRY_CATEGORIES
    │   └── cors.ts              # CORS-Header (damit der Browser zugreifen darf)
    ├── process-brain-dump/
    │   ├── index.ts             # Einstiegspunkt: Text/Audio -> Routing -> { captureId, entries }
    │   ├── systemPrompt.ts      # System-Prompt (Multi-Entry, entries[] + sourceExcerpt)
    │   ├── structureText.ts     # Text  -> Groq (Llama) -> IngestResponse
    │   └── transcribeAudio.ts   # Audio -> Groq (Whisper) -> Text   [Audio-Pfad]
    └── prioritize-tasks/
        └── index.ts             # { tasks } -> Groq (Llama) -> { orderedTaskIds }  [kein DB-Write]
```

**Warum `_shared/`?** Die Edge Functions laufen auf Deno (Server) und können nicht aus
dem Frontend-`src/` importieren. Geteilte Typen liegen daher in `_shared/`
(der Unterstrich sagt der CLI: "nicht als eigene Function deployen").

**`prioritize-tasks` ist bewusst schlank:** keine Validierungs-Schleife, kein DB-Write,
nur IDs zurück. Unbekannte IDs aus der LLM-Antwort werden serverseitig herausgefiltert.

---

## 10. VS Code: Deno-Support einrichten (optional, gegen rote Linien)

Ohne diese Einstellung markiert VS Code `Deno.serve` und `.ts`-Importe rot,
obwohl der Code beim Deploy korrekt läuft.

1. Extension **"Deno"** (Herausgeber: denoland) installieren.
2. Datei `.vscode/settings.json` im Projekt-Hauptordner anlegen:

```json
{
  "deno.enable": true,
  "deno.enablePaths": ["./supabase/functions"],
  "deno.lint": true
}
```

`enablePaths` aktiviert Deno **nur** für die Functions – das React/Vite-Frontend
bleibt unberührt.

3. `Strg + Shift + P` → **"Reload Window"**.

---

## 11. Deno-Eigenheiten (zum Nachschlagen)

- **Importe brauchen die `.ts`-Endung:** `from "./structureText.ts"` (nicht ohne).
- **Globales `Deno`-Objekt:** `Deno.env.get(...)`, `Deno.serve(...)`.
- **`fetch` an Groq:**
  - Bei **JSON** (Text-Pfad): `Content-Type: application/json` setzen.
  - Bei **FormData** (Audio-Pfad): `Content-Type` **NICHT** von Hand setzen!
    (Der multipart-Boundary wird sonst zerstört → Upload kaputt.)

---

## 12. Offene Punkte ("später"-Liste)

Bewusst aufgeschobene Dinge – kein Versäumnis, sondern korrekt nach hinten priorisiert.

- [ ] **CORS einschränken (vor Produktion):** In `_shared/cors.ts` steht
  `Access-Control-Allow-Origin: "*"` (jede Website darf zugreifen). Vor dem
  Live-Gang durch die echte Frontend-Domain ersetzen, z.B.
  `"https://meine-app.vercel.app"`.

- [ ] **Zeitzone beim Datum:** `structureText.ts` berechnet "heute" via
  `new Date().toISOString()` = **UTC**. Spätabends deutscher Zeit kann das einen
  Tag daneben liegen. Sobald der Planner ernst wird: Datum in Europe/Berlin
  berechnen.

- [ ] **Audio-Pfad testen:** Der Audio-Zweig (`transcribeAudio.ts` + Routing in
  `index.ts`) ist deployed, aber erst mit echtem Frontend-Audio testbar
  (PowerShell reicht dafür nicht – braucht eine echte Audio-Datei als Upload).

- [ ] **Dateiname-Verantwortung fürs Audio:** Die MIME-Falle ist server-seitig
  über `ensureFileName` abgesichert. Der saubere Ort bleibt aber das **Frontend**:
  die Aufnahme schon dort als `audio.webm` benennen (näher an der Quelle).