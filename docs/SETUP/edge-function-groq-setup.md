# Setup-Guide: Brain-Dump Edge Function (Supabase + Groq)

Diese Doku beschreibt, wie die KI-Pipeline (`process-brain-dump`) von Grund auf
eingerichtet wird: CLI installieren, Keys besorgen, deployen, testen.

> **Plattform:** Windows / PowerShell
> **Beteiligte Dienste:** Supabase (Edge Function + Secrets), Groq (KI-API)

---

## 0. Überblick: Wie hängt alles zusammen?

Der KI-Anbieter (Groq) ist hinter einer Supabase Edge Function versteckt
("BFF" / Sicherheitsschicht). Der Groq-Key liegt **nur in der Cloud** und
verlässt sie nie. Ablauf eines Requests:

```
Frontend  --(Text/Audio)-->  Edge Function  --(Key aus Secrets)-->  Groq
                                   |
                     validiert jeden Entry im Batch
                     vergibt captureId (UUID) serverseitig
                                   |
Frontend  <--({ captureId, entries: StructuredEntry[] })-----+
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

## 5. Edge Function anlegen

```powershell
supabase functions new process-brain-dump
```

Erzeugt den Ordner `supabase/functions/process-brain-dump/`.
Darin entsteht die Datei-Struktur (siehe Abschnitt 9).

---

## 6. Groq-Key sicher in die Cloud legen

```powershell
# Token muss gesetzt sein (siehe 4 / Workaround), sonst "Access token not provided".
supabase secrets set GROQ_API_KEY=DEIN_GROQ_KEY     # aus Schritt 3d
```

> Der Key landet damit ausschließlich in den Supabase-Secrets der Cloud.
> Im Code wird er über `Deno.env.get("GROQ_API_KEY")` gelesen.

---

## 7. Function deployen

```powershell
supabase functions deploy process-brain-dump --no-verify-jwt
```

- `--no-verify-jwt`: schaltet die Login-Pflicht für die Function ab
  (passend zum MVP **ohne Auth**). Für eine öffentliche App später anders lösen.
- Die Warnung **"Docker is not running" kann ignoriert werden** – Docker braucht
  man nur fürs *lokale* Testen, nicht fürs Deployen in die Cloud.

> **WICHTIG:** Nach jeder Änderung an einem Secret (Abschnitt 6) muss die Function
> **neu deployed** werden, sonst zieht sie den neuen Wert nicht!

---

## 8. Function testen (PowerShell)

PowerShell ist bei `curl` zickig → wir nutzen `Invoke-RestMethod`.
PowerShell versteckt bei Fehlern den Antwort-Body → der `try/catch` macht ihn
sichtbar (zeigt das `details`-Feld mit dem echten Fehler).

```powershell
$headers = @{
  "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvdWJhemZvanR6c2ZweHJ0eHFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MjY4OTIsImV4cCI6MjA5NTEwMjg5Mn0.0EdzBvgPFdEBr3U8f5aP95jiqFGxsXoU2Ko2JRhBojY"
  "Content-Type" = "application/json"
}
$body = '{"text": "Ich muss morgen um 15 Uhr Brot kaufen"}'

try {
  Invoke-RestMethod -Uri "https://woubazfojtzsfpxrtxqa.supabase.co/functions/v1/process-brain-dump" -Method Post -Headers $headers -Body $body
} catch {
  $stream = $_.Exception.Response.GetResponseStream()
  $reader = New-Object System.IO.StreamReader($stream)
  Write-Host $reader.ReadToEnd()
}
```

### Erwartete Antwort (Erfolg)
```json
{
  "captureId": "550e8400-e29b-41d4-a716-446655440000",
  "entries": [
    {
      "category": "TASK",
      "title": "Morgen um 15 Uhr Brot kaufen",
      "sourceExcerpt": "Ich muss morgen um 15 Uhr Brot kaufen",
      "payload": { "date": "...", "startTime": "15:00", "endTime": "15:30", "tags": ["Einkauf"] }
    }
  ]
}
```

Enthält ein Dump mehrere eigenständige Gedanken, gibt die Function entsprechend mehrere
Objekte im `entries`-Array zurück — alle mit derselben `captureId`.

### Fehler-Codes als Wegweiser
| Code | Bedeutung | Wo suchen |
| :--- | :--- | :--- |
| **401** | anon key falsch/fehlt **ODER** "Invalid API Key" von Groq | Schritt 3c bzw. 3d/6 |
| **400** | Request-Body kaputt oder Feld `text` fehlt | Test-Body prüfen |
| **500** | `GROQ_API_KEY` nicht in den Secrets angekommen | Schritt 6 + neu deployen (7) |
| **502** | Groq selbst meckert (Key, Modellname, ...) | `details`-Feld lesen |

> **Logs ansehen:** Dashboard → Functions → `process-brain-dump` → Tab **Logs**.
> Die "booted"-Zeile ist nur der Start; der echte Fehler steht in einer Zeile
> mit `level: error` und beginnt mit "Groq API request failed:".

---

## 9. Datei-Struktur der Function

```
supabase/
└── functions/
    ├── _shared/
    │   ├── contract.ts          # KI-Vertrag: StructuredEntry, IngestResponse, IngestResult, ENTRY_CATEGORIES
    │   └── cors.ts              # CORS-Header (damit der Browser zugreifen darf)
    └── process-brain-dump/
        ├── index.ts             # Einstiegspunkt: Request -> Routing -> Validierungs-Schleife -> { captureId, entries }
        ├── systemPrompt.ts      # System-Prompt (Multi-Entry, entries[] + sourceExcerpt)
        ├── structureText.ts     # Text  -> Groq (Llama) -> IngestResponse
        └── transcribeAudio.ts   # Audio -> Groq (Whisper) -> Text   [Audio-Pfad]
```

**Warum `_shared/`?** Die Edge Function läuft auf Deno (Server) und kann nicht aus
dem Frontend-`src/` importieren. Geteilte Typen liegen daher in `_shared/`
(der Unterstrich sagt der CLI: "nicht als eigene Function deployen").

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