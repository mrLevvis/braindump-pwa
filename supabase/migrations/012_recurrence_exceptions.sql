-- Migration 012: Ausnahmen für Termin-Serien
-- Speichert gelöschte oder geänderte Einzeltermine einer Serien.
-- series_entry_id ist intentional OHNE FK-Constraint (soft reference),
-- damit sie mit braindump_entries__test und anderen Tabellenvarianten funktioniert.

CREATE TABLE IF NOT EXISTS public.recurrence_exceptions (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id           UUID        NOT NULL DEFAULT auth.uid()
                                REFERENCES auth.users(id) ON DELETE CASCADE,
  series_entry_id   UUID        NOT NULL,
  original_date     DATE        NOT NULL,
  type              VARCHAR(10) NOT NULL CHECK (type IN ('deleted', 'modified')),
  override_entry_id UUID        DEFAULT NULL,
  UNIQUE (series_entry_id, original_date)
);

ALTER TABLE public.recurrence_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny all anon" ON public.recurrence_exceptions
  FOR ALL TO anon USING (false);

CREATE POLICY "allow authenticated own" ON public.recurrence_exceptions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
