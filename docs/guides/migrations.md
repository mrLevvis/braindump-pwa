# Supabase Migrations

Neue Migrations werden automatisch ausgeführt sobald sie auf `main` gepusht werden.

## Neue Migration anlegen

1. Datei in `supabase/migrations/` erstellen — nächste Nummer im Format `NNN_beschreibung.sql`
2. SQL schreiben
3. Committen und pushen

```bash
git add supabase/migrations/020_meine_aenderung.sql
git commit -m "feat: ..."
git push
```

GitHub Actions führt `supabase db push` automatisch aus.

## Hinweise

- Nummerierung immer fortführen: `020_`, `021_`, ...
- Nur echte Migrations in `supabase/migrations/` — Hilfsskripte gehören nach `supabase/scripts/`
- Workflow-Status unter **GitHub → Actions → Supabase Migrations**
