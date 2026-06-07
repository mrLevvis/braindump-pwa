-- feat(ingest)!: Multi-Entry-Ingest — Provenienz-Spalten
-- capture_id verbindet alle Entries desselben Dumps (eine UUID pro Dump, serverseitig vergeben).
-- source_excerpt enthält den relevanten Wortlaut des Original-Dumps für diesen Entry.
-- Beide Spalten sind nullable, damit bestehende Zeilen ohne Migration-Fehler bleiben.

ALTER TABLE braindump_entries__test
  ADD COLUMN IF NOT EXISTS capture_id  UUID,
  ADD COLUMN IF NOT EXISTS source_excerpt TEXT;
