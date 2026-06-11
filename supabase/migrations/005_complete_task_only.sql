-- feat(db): CHECK-Constraint – completed nur für TASK erlaubt
-- Erzwingt die Invariante "completed ist nur für TASK relevant" auf DB-Ebene.
-- Nicht-TASK-Einträge (EVENT, NOTE) müssen completed = NULL haben.
--
-- Ablauf:
--   1. NOT NULL + DEFAULT FALSE fallen weg (completed wird nullable, kein Default mehr).
--   2. Bestandsdaten: alle Nicht-TASK-Zeilen auf NULL setzen.
--   3. CHECK-Constraint anlegen – schlägt fehl, wenn category != 'TASK' und completed IS NOT NULL.

-- ─── braindump_entries ────────────────────────────────────────────────────────

ALTER TABLE braindump_entries
  ALTER COLUMN completed DROP NOT NULL,
  ALTER COLUMN completed DROP DEFAULT;

UPDATE braindump_entries
  SET completed = NULL
  WHERE category != 'TASK';

ALTER TABLE braindump_entries
  ADD CONSTRAINT chk_completed_task_only
    CHECK (category = 'TASK' OR completed IS NULL);

-- ─── braindump_entries__mock ──────────────────────────────────────────────────

ALTER TABLE braindump_entries__mock
  ALTER COLUMN completed DROP NOT NULL,
  ALTER COLUMN completed DROP DEFAULT;

UPDATE braindump_entries__mock
  SET completed = NULL
  WHERE category != 'TASK';

ALTER TABLE braindump_entries__mock
  ADD CONSTRAINT chk_completed_task_only
    CHECK (category = 'TASK' OR completed IS NULL);

-- ─── braindump_entries__test ──────────────────────────────────────────────────

ALTER TABLE braindump_entries__test
  ALTER COLUMN completed DROP NOT NULL,
  ALTER COLUMN completed DROP DEFAULT;

UPDATE braindump_entries__test
  SET completed = NULL
  WHERE category != 'TASK';

ALTER TABLE braindump_entries__test
  ADD CONSTRAINT chk_completed_task_only
    CHECK (category = 'TASK' OR completed IS NULL);
