CREATE TABLE public.shopping_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    label TEXT NOT NULL,
    is_done BOOLEAN NOT NULL DEFAULT false,
    source_dump UUID
);

ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny all anon" ON public.shopping_items
  FOR ALL TO anon USING (false);

-- Covers SELECT, INSERT, UPDATE, DELETE — no silent RLS block on delete.
CREATE POLICY "allow authenticated" ON public.shopping_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
