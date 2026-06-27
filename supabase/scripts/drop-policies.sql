-- braindump_entries
DROP POLICY IF EXISTS "Allow public read/write access" ON public.braindump_entries;

-- Sicherheitshalber auch die anderen Tabellen prüfen und bereinigen
DROP POLICY IF EXISTS "Allow public read/write access" ON public.braindump_entries__test;
DROP POLICY IF EXISTS "Allow public read/write access" ON public.braindump_entries__mock;
DROP POLICY IF EXISTS "Allow public read/write access" ON public.shopping_items;
DROP POLICY IF EXISTS "Allow public read/write access" ON public.recurrence_exceptions;

-- ?? (nachtragen)
DROP POLICY IF EXISTS "Allow all deletes for test" ON public.braindump_entries__test;
DROP POLICY IF EXISTS "Allow all inserts for test" ON public.braindump_entries__test;
DROP POLICY IF EXISTS "Allow all selects for test" ON public.braindump_entries__test;
DROP POLICY IF EXISTS "UPDATE completed for TASKs" ON public.braindump_entries__test;
