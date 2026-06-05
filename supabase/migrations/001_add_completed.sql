-- A13: Task-Status „erledigt" (abhaken)
-- Adds a mutable completed flag to entries. Separate from the immutable dump content.
-- Default FALSE so existing rows are automatically "not completed".

ALTER TABLE braindump_entries
  ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE braindump_entries__mock
  ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE braindump_entries__test
  ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT FALSE;
