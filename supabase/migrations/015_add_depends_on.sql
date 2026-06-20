-- Migration 015: depends_on Array für Task-Abhängigkeiten (Vorgänger-IDs)
ALTER TABLE braindump_entries__test
  ADD COLUMN IF NOT EXISTS depends_on TEXT[] DEFAULT NULL;
