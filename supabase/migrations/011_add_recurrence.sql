-- Migration 011: Wiederholungsregeln für Termine (Termin-Serien)
-- recurrence: JSONB-Regel (freq, interval, byDay, byMonthPos, end)
-- series_entry_id: Soft-FK auf den Serien-Master (für Override-Instances)
-- Gilt für alle drei Entry-Tabellen.

ALTER TABLE public.braindump_entries
  ADD COLUMN IF NOT EXISTS recurrence       JSONB    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS series_entry_id  UUID     DEFAULT NULL;

ALTER TABLE public.braindump_entries__mock
  ADD COLUMN IF NOT EXISTS recurrence       JSONB    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS series_entry_id  UUID     DEFAULT NULL;

ALTER TABLE public.braindump_entries__test
  ADD COLUMN IF NOT EXISTS recurrence       JSONB    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS series_entry_id  UUID     DEFAULT NULL;
