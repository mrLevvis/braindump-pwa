-- Migration 008: Pro-User-Isolation für alle Entry- und Shopping-Tabellen
--
-- Muster: user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid()
-- DEFAULT auth.uid() setzt die user_id automatisch auf DB-Ebene beim INSERT —
-- kein Service-Code muss user_id explizit mitgeben.
--
-- TRUNCATE ist nötig, weil auth.uid() im SQL-Editor NULL zurückgibt (keine Session)
-- und NOT NULL sonst beim Befüllen bestehender Rows fehlschlägt.
-- ADD COLUMN IF NOT EXISTS macht die Migration idempotent bei erneutem Ausführen.

TRUNCATE TABLE
  public.braindump_entries,
  public.braindump_entries__mock,
  public.braindump_entries__test,
  public.shopping_items;

-- ── braindump_entries ──────────────────────────────────────────────────────────

ALTER TABLE public.braindump_entries
  ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL DEFAULT auth.uid()
  REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "allow authenticated" ON public.braindump_entries;
CREATE POLICY "allow authenticated" ON public.braindump_entries
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── braindump_entries__mock ────────────────────────────────────────────────────

ALTER TABLE public.braindump_entries__mock
  ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL DEFAULT auth.uid()
  REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "allow authenticated" ON public.braindump_entries__mock;
CREATE POLICY "allow authenticated" ON public.braindump_entries__mock
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── braindump_entries__test ────────────────────────────────────────────────────

ALTER TABLE public.braindump_entries__test
  ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL DEFAULT auth.uid()
  REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "allow authenticated" ON public.braindump_entries__test;
CREATE POLICY "allow authenticated" ON public.braindump_entries__test
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── shopping_items ─────────────────────────────────────────────────────────────

ALTER TABLE public.shopping_items
  ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL DEFAULT auth.uid()
  REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "allow authenticated" ON public.shopping_items;
CREATE POLICY "allow authenticated" ON public.shopping_items
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
