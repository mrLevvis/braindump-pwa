CREATE TABLE public.issues (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id     UUID        NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email  TEXT        NOT NULL DEFAULT auth.email(),
    type        VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'suggestion')),
    title       TEXT        NOT NULL,
    description TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done'))
);

ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Kein anonymer Zugriff
CREATE POLICY "deny all anon" ON public.issues
    FOR ALL TO anon USING (false);

-- Alle authentifizierten User können eigene Issues anlegen
CREATE POLICY "allow authenticated insert own" ON public.issues
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Alle authentifizierten User können alle Issues lesen (vertrauenswürdiger Kreis)
CREATE POLICY "allow authenticated select" ON public.issues
    FOR SELECT TO authenticated USING (true);

-- Status-Updates über Admin-UI (Kreis ist klein und bekannt)
CREATE POLICY "allow authenticated update" ON public.issues
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
