# Terminal-Cheatsheet

Alle wichtigen Befehle auf einen Blick. Tiefer gehende Erklärungen in den jeweiligen Setup-Guides.

---

## Meine persönliche gängige Befehlskette vor jedem Run

```bash
scoop update supabase
supabase db push
supabase functions deploy process-brain-dump --no-verify-jwt
supabase functions deploy reprocess-entry --no-verify-jwt
supabase functions deploy prioritize-tasks --no-verify-jwt
npx tsc --noEmit
npm run dev
```



## Tägliche Entwicklung

```bash
npm run dev          # Dev-Server starten (http://localhost:5173)
npm run build        # Produktions-Build
npm run preview      # Produktions-Build lokal testen
npm run lint         # ESLint
npx tsc --noEmit     # TypeScript-Check ohne Build
```

---

## Git

```bash
git pull
git status
git add <datei>
git commit -m "feat: ..."
git push
git log --oneline -10
```

---

## Migrations

Migrations laufen **automatisch** via GitHub Actions beim Push auf `main` — `supabase db push` muss normalerweise nicht manuell aufgerufen werden.

Nächste Migrations-Nummer: **`020_`**

```bash
# Nur bei Bedarf manuell ausführen:
supabase db push
```

Workflow-Status: **GitHub → Actions → Supabase Migrations**

---

## Edge Functions deployen

Nach jeder Änderung an einer Function oder an den Secrets **alle drei** neu deployen:

```powershell
supabase functions deploy process-brain-dump --no-verify-jwt
supabase functions deploy reprocess-entry --no-verify-jwt
supabase functions deploy prioritize-tasks --no-verify-jwt
```

---

## Secrets setzen

```powershell
supabase secrets set GROQ_API_KEY=dein_groq_key
```

> Nach dem Setzen alle drei Functions neu deployen (s. o.), sonst ziehen sie den neuen Wert nicht.

---

## Supabase CLI (Einrichtung / bei Problemen)

```powershell
# CLI installieren (einmalig, via Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# CLI aktualisieren
scoop update supabase

# Version prüfen
supabase --version

# Einloggen + Projekt verknüpfen (einmalig pro Rechner)
supabase login
supabase link --project-ref DEINE_PROJECT_REF

# Falls login zickt: Token direkt setzen (gilt nur für dieses Terminal-Fenster)
$env:SUPABASE_ACCESS_TOKEN="dein_supabase_token"
```

---

## Edge Functions lokal testen (PowerShell)

```powershell
$anonKey = "dein_anon_key"   # oder: $env:VITE_SUPABASE_ANON_KEY
$headers = @{ "apikey" = $anonKey; "Content-Type" = "application/json" }

# process-brain-dump
$body = '{"text": "Milch kaufen und Zahnarzt morgen um 10"}'
try {
  Invoke-RestMethod -Uri "https://woubazfojtzsfpxrtxqa.supabase.co/functions/v1/process-brain-dump" -Method Post -Headers $headers -Body $body
} catch {
  $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
  Write-Host $reader.ReadToEnd()
}

# reprocess-entry
$body = '{"text": "Zahnarzttermin nächste Woche Dienstag um 14 Uhr"}'
try {
  Invoke-RestMethod -Uri "https://woubazfojtzsfpxrtxqa.supabase.co/functions/v1/reprocess-entry" -Method Post -Headers $headers -Body $body
} catch {
  $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
  Write-Host $reader.ReadToEnd()
}
```
