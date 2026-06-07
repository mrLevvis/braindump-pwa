-- feat(ingest): summary-Stichpunkte pro Entry
-- summary speichert ein JSON-Array von Strings, das die KI pro Entry erzeugt.
-- Nullable, damit bestehende Zeilen ohne Migration-Fehler bleiben.

ALTER TABLE braindump_entries
  ADD COLUMN IF NOT EXISTS summary JSONB;

ALTER TABLE braindump_entries__mock
  ADD COLUMN IF NOT EXISTS summary JSONB;

ALTER TABLE braindump_entries__test
  ADD COLUMN IF NOT EXISTS summary JSONB;
