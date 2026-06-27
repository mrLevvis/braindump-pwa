SELECT tablename, policyname, qual
FROM pg_policies
WHERE tablename IN ('braindump_entries', 'shopping_items', 'recurrence_exceptions')
ORDER BY tablename;
