-- Enable RLS on all tables
ALTER TABLE braindump_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE braindump_entries__mock ENABLE ROW LEVEL SECURITY;
ALTER TABLE braindump_entries__test ENABLE ROW LEVEL SECURITY;

-- Block bare anon-key requests (no session) — covers the public API abuse vector
CREATE POLICY "deny all anon" ON braindump_entries
  FOR ALL TO anon USING (false);
CREATE POLICY "deny all anon" ON braindump_entries__mock
  FOR ALL TO anon USING (false);
CREATE POLICY "deny all anon" ON braindump_entries__test
  FOR ALL TO anon USING (false);

-- Allow authenticated sessions (includes anonymous auth users created by signInAnonymously)
-- Single-user app: no per-user filter needed yet. Tighten to USING (auth.uid() = user_id) once login exists.
CREATE POLICY "allow authenticated" ON braindump_entries
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow authenticated" ON braindump_entries__mock
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow authenticated" ON braindump_entries__test
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
